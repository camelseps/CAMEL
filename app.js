 const $ = id => document.getElementById(id);
let actual = null, graficosRenderizados = false;

const SECCIONES = [
  ["Activos","activos"],["Pasivo y Patrimonio","pas_patri"],["Resultado Neto","resultados"],
  ["Apalancamiento","apalancamiento"],["Liquidez","liquidez"],["Rentabilidad (ROA y ROE)","roa_roe"],
  ["Capitalización Neta","capitalizacion"],["Grado de Absorción","absorcion"],["Morosidad","morosidad"]];

function cargar(ruc) {
  return new Promise((ok, err) => {
    if (window.COAC_DATA && COAC_DATA[ruc]) return ok(COAC_DATA[ruc]);
    const s = document.createElement("script");
    s.src = `datos/${ruc}.js?v=${Date.now()}`;
    s.onload = () => ok(COAC_DATA[ruc]); s.onerror = err;
    document.head.appendChild(s);
  });
}

const aObj = p => (typeof p === "string") ? JSON.parse(p) : p;

function dibujar(id, p) {
  p = aObj(p);
  Plotly.newPlot(id, p.data, p.layout, Object.assign({displayModeBar:false, responsive:true}, p.config||{}));
}

function dibujarRadar(d) {
  const p = aObj(d.plots.radar);
  dibujar("p-radar", p);
  const n = p.data.length - 1;
  Plotly.animate("p-radar", {data:[{r:d.radar_r, theta:p.data[n].theta}], traces:[n]},
                 {transition:{duration:900, easing:"cubic-out"}, frame:{duration:900, redraw:true}});
}

function armarSeccionesGraficos(d) {
  $("tab-graficos").innerHTML = SECCIONES.map(([t,k]) => `
    <h3 class="seccion-camel">${t}</h3>
    <div class="row"><div class="col-sm-8"><div id="g-${k}" style="height:380px"></div></div>
    <div class="col-sm-4">${d.html.tarjetas[k]||""}</div></div>`).join("");
  SECCIONES.forEach(([t,k]) => dibujar("g-"+k, d.plots[k]));
}

async function mostrar(ruc) {
  $("aviso").textContent = "Cargando…";
  const d = await cargar(ruc); actual = d; graficosRenderizados = false;
  $("aviso").textContent = "";
  $("resumen").innerHTML = d.html.resumen;
  $("calif-final").innerHTML = d.html.calif_final;
  $("gauge").innerHTML = d.cat ? `<img class="img-responsive" src="img/gauge_${ruc}.png">` : "";
  $("pins").innerHTML = d.html.pins; $("resumen-ser").innerHTML = d.html.resumen_ser;
  $("pond").innerHTML = d.html.ponderacion;
  $("serie-tabla").innerHTML = d.html.serie_tabla || "";
$("capacidad").innerHTML = d.html.capacidad || "";
  dibujarRadar(d); dibujar("p-historial", d.plots.historial);
  if (!$("tab-graficos").hidden) { armarSeccionesGraficos(d); graficosRenderizados = true; }
}

$("tabs").addEventListener("click", e => {
  const t = e.target.dataset.tab; if (!t) return;
  document.querySelectorAll("#tabs li").forEach(li => li.classList.toggle("activa", li === e.target));
  document.querySelectorAll(".panel-tab").forEach(p => p.hidden = (p.id !== "tab-" + t));
  if (t === "graficos" && actual && !graficosRenderizados) { armarSeccionesGraficos(actual); graficosRenderizados = true; }
  if (t === "radar") { Plotly.Plots.resize("p-radar"); Plotly.Plots.resize("p-historial"); }
});

const ts = new TomSelect("#sel-coac", {
  options: INDICE.map(c => ({value:c.ruc, text:c.nombre})).sort((a,b)=>a.text.localeCompare(b.text)),
  maxOptions: 2000, onChange: v => v && mostrar(v)
});

const SEGS = Object.keys(EDA_TXT);
const INDS = Object.keys(EDA_TXT[SEGS[0]]).filter(k => k.startsWith("IND_"));
const llenar = (id, vals) => $(id).innerHTML = vals.map(v => `<option>${v}</option>`).join("");
llenar("eda-seg", SEGS); llenar("eda-ind", INDS); llenar("eda-k", [2,3,4,5,6]); $("eda-k").value = 3;
function eda() {
  const seg = $("eda-seg").value, s = seg.replace(" ",""), ind = $("eda-ind").value, k = $("eda-k").value;
  $("eda-disp").src = `img/eda_${s}_disp_${ind}.png`; $("t-disp").textContent = EDA_TXT[seg][ind];
  $("eda-pca").src  = `img/eda_${s}_pca.png`;         $("t-pca").textContent  = EDA_TXT[seg].pca;
  $("eda-clu").src  = `img/eda_${s}_cluster_k${k}.png`; $("t-clu").textContent = EDA_TXT[seg]["cluster"+k];
}
["eda-seg","eda-ind","eda-k"].forEach(i => $(i).addEventListener("change", eda)); eda();


