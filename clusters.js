(async function () {
  const get = id => document.getElementById('cluster-' + id);
  const output = get('results');
  try {
    const response = await fetch('data/clusters.json');
    if (!response.ok) throw Error(response.status);
    const samples = await response.json();
    const fixed = value => value.toFixed(3);
    const table = (headers, rows) => '<table style="border-spacing:1em .45em;text-align:left"><thead><tr>' +
      headers.map(h => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(row => '<tr>' + row.map(value => '<td>' + value + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    function render() {
      const sample = samples[get('sample').selectedIndex];
      const run = sample.runs.find(r => r.method === get('method').value && r.k === Number(get('k').value));
      const clusters = run.profiles.map((_, j) => '簇 ' + (j + 1));
      const members = j => sample.names.filter((_, i) => run.labels[i] === j);
      const metrics = ['GDP 同比','失业率','CPI 同比','联邦基金利率'].slice(0, run.profiles[0].length);
      const partyRows = [true,false].map(d => [d ? '民主党' : '共和党', ...clusters.map((_, j) =>
        run.labels.filter((label, i) => label === j && sample.party[i] === d).length)]);
      const maxHeight = Math.max(...sample.heights.flat());
      const x = height => 180 + height / maxHeight * 420;
      const y = pos => 4 + 2.3 * pos;
      const lines = sample.positions.map((points, i) => '<polyline fill="none" stroke="currentColor" points="' +
        points.map((p,j) => x(sample.heights[i][j]) + ',' + y(p)).join(' ') + '"/>').join('');
      const leaves = sample.leaves.map((leaf,i) => '<text x="173" text-anchor="end" y="' + (y(5+i*10)+4) + '">' + sample.names[leaf] + '</text>').join('');
      output.innerHTML = '<h3>分组质量与稳定性</h3><p>' + sample.names.length + ' 个任期 · 轮廓系数 ' + fixed(run.silhouette) +
        ' · 逐一留出任期、重新标准化并拟合后，与原分组在保留任期上的平均 ARI 为 ' +
        fixed(run.stability.reduce((a,b)=>a+b,0)/run.stability.length) + '（范围 ' + fixed(Math.min(...run.stability)) + ' 至 ' + fixed(Math.max(...run.stability)) + '）。</p>' +
        '<h3>各簇经济画像</h3><p>数值为簇内平均 Z 分数。正值表示高于所选样本的任期均值。</p><div style="overflow:auto">' +
        table(['分组',...metrics,'成员'], run.profiles.map((profile,j)=>[clusters[j],...profile.map(fixed),members(j).join('、')])) +
        '</div><h3>党派与分组的对应</h3><p>调整兰德指数（ARI）为 ' + fixed(run.ari) +
        '。1 表示划分完全一致，0 对应随机一致水平，负值表示低于该水平。</p>' + table(['党派',...clusters],partyRows) +
        '<h3>Ward 层次树</h3><p>由左向右为合并距离，根节点高度 ' + fixed(maxHeight) + '。树形始终显示 Ward 的合并顺序。</p>' +
        '<svg role="img" aria-label="Ward 任期聚类树" style="width:100%;max-width:650px" viewBox="0 0 615 ' + (sample.names.length*23+12) + '">' + lines + leaves + '</svg>';
    }
    ['sample','method','k'].forEach(id => get(id).addEventListener('change',render));
    render();
  } catch (error) { output.textContent = '聚类结果加载失败：' + error.message; }
})();