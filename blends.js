// Moteur de suggestions de mélanges + gestion des idées de mélange enregistrées manuellement.

// Quelques duos de superposition (layering) réellement connus et pratiqués par les amateurs de parfum,
// en plus des suggestions automatiques par recoupement d'accords.
const KNOWN_LAYERING_DUOS = [
  {a:"oud-wood-tom-ford", b:"tobacco-vanille-tom-ford", why:"Un duo de superposition très populaire chez Tom Ford : le boisé fumé de l'un rencontre le tabac-vanille de l'autre pour un sillage plus riche."},
  {a:"santal-33-le-labo", b:"another-13-le-labo", why:"Le Labo encourage explicitement à superposer ses créations : le santal épicé et le musc ambré s'enlacent bien."},
  {a:"molecule-01-escentric-molecules", b:"portrait-of-a-lady-frederic-malle", why:"Molecule 01 est conçu comme un « booster » : appliqué en dessous, il amplifie la diffusion des parfums floraux comme celui-ci."},
  {a:"baccarat-rouge-540-maison-francis-kurkdjian", b:"grand-soir-maison-francis-kurkdjian", why:"Deux ambrés de la même maison : superposés, ils prolongent la chaleur et le sillage caractéristique de la maison."},
  {a:"molecule-02-escentric-molecules", b:"black-saffron-byredo", why:"Molecule 02 (ambroxan) sert souvent de base pour intensifier des parfums plus discrets comme celui-ci."},
];

// Conseils de mise en couche (crèmes, huiles, gels douche...) par famille d'accord.
// Génériques et non liés à une marque précise, faute de pouvoir garantir la disponibilité d'un produit commercial exact.
const LAYERING_TIPS = {
  "Boisé": "Une crème ou une huile corporelle neutre à légèrement boisée (santal, cèdre) en dessous prolonge la tenue et amplifie le sillage.",
  "Ambré": "Une huile ou un lait corporel ambré/doré en base garde la chaleur du parfum plus longtemps sur la peau.",
  "Vanillé": "Un lait corporel vanillé ou à la fève tonka fixe bien ce type de parfum et accentue son côté gourmand.",
  "Gourmand": "Une crème ou un baume à la vanille, au caramel ou au cacao en dessous prolonge le côté gourmand sans dénaturer l'accord.",
  "Agrumes": "Un gel douche ou une brume aux agrumes en couche de fond aide à faire durer la fraîcheur des notes de tête, qui s'évaporent vite seules.",
  "Floral": "Une lotion florale neutre (fleur de coton, muguet) en base adoucit la projection sans masquer le bouquet.",
  "Musc": "Une crème « peau propre » ou musc blanc en dessous accentue l'effet naturel recherché par ce type de composition.",
  "Musqué": "Une crème « peau propre » ou musc blanc en dessous accentue l'effet naturel recherché par ce type de composition.",
  "Oud": "Un savon ou une huile à l'oud en soin corporel accentue encore la profondeur — à réserver si vous aimez les sillages marqués.",
  "Épicé": "Une lotion légèrement épicée (cannelle, cardamome) en base ajoute du corps sans surcharger la composition.",
  "Aromatique": "Une lotion fraîche non parfumée ou légèrement herbacée garde le profil net sans le noyer.",
  "Vert": "Une lotion fraîche non parfumée ou légèrement herbacée garde le profil net sans le noyer.",
  "Cuiré": "Un baume ou une huile ambrée en dessous adoucit le côté cuir tout en gardant du caractère.",
  "Poudré": "Une crème à l'iris ou légèrement talquée en base accentue le côté doux et velouté.",
  "Fumé": "Une huile corporelle boisée ou ambrée souligne le sillage fumé sans l'alourdir.",
  "Aquatique": "Un gel douche marin ou aquatique en dessous prolonge la fraîcheur, qui seule tient peu sur la peau.",
  "Fruité": "Une lotion fruitée neutre en base aide à faire durer les notes de tête, souvent les plus fugaces.",
  "Minéral": "Une lotion neutre non parfumée laisse respirer le côté minéral sans le brouiller.",
  "Tabac": "Une huile ou un baume ambré en dessous accompagne bien le tabac sans l'assécher.",
  "Rose": "Une crème légèrement florale ou musquée en base soutient la rose sans en changer la couleur.",
  "Iris": "Une crème poudrée ou à l'amande douce en dessous prolonge le velouté caractéristique de l'iris.",
  "Café": "Une huile ou un baume ambré en base accompagne bien la torréfaction sans l'alourdir davantage.",
  "Savonneux": "Une lotion neutre et propre en dessous, pour ne pas rajouter de parfum sur un profil déjà « savon ».",
};

function byId(id){ return PERFUMES.find(p=>p.id===id); }

function sharedAccordCount(p1, p2){
  const a2 = new Set(p2.accords);
  return p1.accords.filter(a=>a2.has(a)).length;
}

function autoSuggestions(perfume, limit){
  return PERFUMES
    .filter(o=>o.id!==perfume.id)
    .map(o=>({perfume:o, shared:perfume.accords.filter(a=>o.accords.includes(a))}))
    .filter(x=>x.shared.length>0)
    .sort((a,b)=>b.shared.length-a.shared.length || a.perfume.name.localeCompare(b.perfume.name))
    .slice(0, limit)
    .map(x=>({perfume:x.perfume, shared:x.shared}));
}

function knownDuosFor(perfume){
  return KNOWN_LAYERING_DUOS
    .filter(d=>d.a===perfume.id || d.b===perfume.id)
    .map(d=>{
      const otherId = d.a===perfume.id ? d.b : d.a;
      const other = byId(otherId);
      return other ? {perfume:other, why:d.why} : null;
    })
    .filter(Boolean);
}

function layeringTipsFor(perfume){
  const tips = perfume.accords.map(a=>LAYERING_TIPS[a]).filter(Boolean);
  return [...new Set(tips)].slice(0,3);
}

// ===== Mélanges enregistrés manuellement (localStorage, propre au navigateur) =====
const CUSTOM_KEY = "olfactif_custom_blends_v1";

function loadCustomBlends(){
  try{
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function saveCustomBlends(list){
  try{ localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); }catch(e){}
}

function addCustomBlend(perfumeIds, note){
  const list = loadCustomBlends();
  list.unshift({
    id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    perfumeIds,
    note: note || "",
    createdAt: new Date().toISOString(),
  });
  saveCustomBlends(list);
  return list;
}

function removeCustomBlend(blendId){
  const list = loadCustomBlends().filter(b=>b.id!==blendId);
  saveCustomBlends(list);
  return list;
}

function customBlendsFor(perfumeId){
  return loadCustomBlends().filter(b=>b.perfumeIds.includes(perfumeId));
}
