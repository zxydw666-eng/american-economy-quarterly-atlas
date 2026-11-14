"""Run from repository root: python build_clusters.py (SciPy, scikit-learn)."""
import calendar
import json
from pathlib import Path

import numpy as np
from scipy.cluster.hierarchy import cut_tree, dendrogram, linkage
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits

data = Path("data")
read = lambda name: json.loads((data / name).read_text(encoding="utf8"))
bands = read("history.json")["bands"]
terms = {b["label"]: [] for b in bands}
for row in read("quarters.json"):
    year, month = map(int, row["date"][:7].split("-"))
    month += 2
    day = f"{year}-{month:02}-{calendar.monthrange(year, month)[1]}"
    band, = [b for b in bands if b["start"] <= day and (not b["end"] or day < b["end"])]
    terms[band["label"]].append(row)

democrats = {"Harry S. Truman", "John F. Kennedy", "Lyndon B. Johnson", "Jimmy Carter",
             "Bill Clinton", "Barack Obama", "Joe Biden"}
features = ["gdp", "unemployment", "inflation"]
complete = [name for name, rows in terms.items() if rows and all(r["rate"] is not None for r in rows)]

def fit(matrix, method, k):
    z = StandardScaler().fit_transform(matrix)
    if method == "Ward":
        return cut_tree(linkage(z, method="ward"), n_clusters=k).ravel()
    return KMeans(n_clusters=k, n_init=50, random_state=42).fit_predict(z)

def analyze(names, keys):
    x = np.array([[np.mean([r[key] for r in terms[name] if r[key] is not None]) for key in keys] for name in names])
    assert np.isfinite(x).all() and (x.std(axis=0) > 0).all()
    z = StandardScaler().fit_transform(x)
    tree = dendrogram(linkage(z, method="ward"), no_plot=True)
    runs = []
    for method in ["Ward", "K-means"]:
        for k in [2, 3, 4]:
            labels = fit(x, method, k)
            assert len(set(labels)) == k
            stability = []
            for i in range(len(x)):
                keep = np.arange(len(x)) != i
                stability.append(adjusted_rand_score(labels[keep], fit(x[keep], method, k)))
            party = [name in democrats for name in names]
            runs.append(dict(method=method, k=k, labels=labels.tolist(),
                             silhouette=silhouette_score(z, labels), ari=adjusted_rand_score(party, labels),
                             stability=stability, profiles=[z[labels == j].mean(axis=0).tolist() for j in range(k)]))
    return dict(names=names, party=[n in democrats for n in names], runs=runs,
                leaves=tree["leaves"], heights=tree["dcoord"], positions=tree["icoord"])

with threadpool_limits(limits=1):
    results = [analyze(list(terms), features), analyze(complete, features), analyze(complete, features + ["rate"])]
(data / "clusters.json").write_text(json.dumps(results, separators=(",", ":")), encoding="utf8")
