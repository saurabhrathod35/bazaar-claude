/* ============================================================
   KEENPLAZA — mock-data.js
   Single source of demo data for storefront, services, admin, mobile.
   Everything here is fake. No real credentials, no real APIs.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- helpers ---------- */
  const rnd = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(7);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const daysAgo = d => { const t = new Date('2026-08-09T10:30:00'); t.setDate(t.getDate() - d); return t.toISOString(); };

  /* ---------- categories (nested) ---------- */
  const categories = [
    { id:'c-fashion', name:'Fashion', slug:'fashion', icon:'👗', order:1, status:'Active', parent:null,
      desc:'Apparel, footwear and accessories for men, women and kids.', children:[
      { id:'c-men', name:'Men', slug:'men', parent:'c-fashion', order:1, status:'Active', children:[
        { id:'c-men-shirts', name:'Shirts', slug:'shirts', parent:'c-men', order:1, status:'Active' },
        { id:'c-men-jeans', name:'Jeans', slug:'jeans', parent:'c-men', order:2, status:'Active' },
        { id:'c-men-shoes', name:'Shoes', slug:'shoes', parent:'c-men', order:3, status:'Active' }]},
      { id:'c-women', name:'Women', slug:'women', parent:'c-fashion', order:2, status:'Active', children:[
        { id:'c-wom-dress', name:'Dresses', slug:'dresses', parent:'c-women', order:1, status:'Active' },
        { id:'c-wom-tops', name:'Tops', slug:'tops', parent:'c-women', order:2, status:'Active' },
        { id:'c-wom-foot', name:'Footwear', slug:'footwear', parent:'c-women', order:3, status:'Active' }]}
    ]},
    { id:'c-electronics', name:'Electronics', slug:'electronics', icon:'📱', order:2, status:'Active', parent:null,
      desc:'Phones, audio, TV and computing.', children:[
      { id:'c-mobiles', name:'Mobiles', slug:'mobiles', parent:'c-electronics', order:1, status:'Active' },
      { id:'c-audio', name:'Audio', slug:'audio', parent:'c-electronics', order:2, status:'Active' },
      { id:'c-tv', name:'Television', slug:'television', parent:'c-electronics', order:3, status:'Active' }
    ]},
    { id:'c-beauty', name:'Beauty', slug:'beauty', icon:'💄', order:3, status:'Active', parent:null,
      desc:'Makeup, skincare and grooming.', children:[
      { id:'c-makeup', name:'Makeup', slug:'makeup', parent:'c-beauty', order:1, status:'Active' },
      { id:'c-skincare', name:'Skincare', slug:'skincare', parent:'c-beauty', order:2, status:'Active' }
    ]},
    { id:'c-home', name:'Home & Kitchen', slug:'home-kitchen', icon:'🏠', order:4, status:'Active', parent:null,
      desc:'Cookware, furniture and decor.', children:[
      { id:'c-cook', name:'Cookware', slug:'cookware', parent:'c-home', order:1, status:'Active' },
      { id:'c-furniture', name:'Furniture', slug:'furniture', parent:'c-home', order:2, status:'Active' }
    ]},
    { id:'c-appliances', name:'Appliances', slug:'appliances', icon:'🧺', order:5, status:'Active', parent:null,
      desc:'Large and small home appliances.', children:[
      { id:'c-ac', name:'Air Conditioners', slug:'air-conditioners', parent:'c-appliances', order:1, status:'Active' },
      { id:'c-washing', name:'Washing Machines', slug:'washing-machines', parent:'c-appliances', order:2, status:'Active' },
      { id:'c-purifier', name:'Water Purifiers', slug:'water-purifiers', parent:'c-appliances', order:3, status:'Active' }
    ]},
    { id:'c-grocery', name:'Grocery', slug:'grocery', icon:'🛒', order:6, status:'Active', parent:null, desc:'Daily essentials.' },
    { id:'c-footwear', name:'Footwear', slug:'footwear-top', icon:'👟', order:7, status:'Active', parent:null, desc:'Sneakers, formals, sandals.' },
    { id:'c-accessories', name:'Accessories', slug:'accessories', icon:'⌚', order:8, status:'Draft', parent:null, desc:'Watches, bags, eyewear.' }
  ];

  const brands = [
    { id:'b-nike', name:'Nike', products:24, status:'Active', logo:'NK' },
    { id:'b-samsung', name:'Samsung', products:38, status:'Active', logo:'SM' },
    { id:'b-boat', name:'boAt', products:19, status:'Active', logo:'bA' },
    { id:'b-prestige', name:'Prestige', products:14, status:'Active', logo:'PR' },
    { id:'b-lakme', name:'Lakmé', products:22, status:'Active', logo:'LK' },
    { id:'b-lg', name:'LG', products:17, status:'Active', logo:'LG' },
    { id:'b-levis', name:"Levi's", products:31, status:'Active', logo:'LV' },
    { id:'b-hnm', name:'H&M', products:44, status:'Active', logo:'HM' },
    { id:'b-puma', name:'Puma', products:27, status:'Active', logo:'PM' },
    { id:'b-philips', name:'Philips', products:12, status:'Draft', logo:'PH' }
  ];

  /* ---------- size masters (independent master data) ---------- */
  const sizeGroups = [
    { id:'sg-cloth', name:'Clothing', appliesTo:['c-fashion','c-men','c-women','c-men-shirts','c-wom-dress','c-wom-tops'],
      sizes:[{id:'s-xs',label:'XS',order:1},{id:'s-s',label:'S',order:2},{id:'s-m',label:'M',order:3},
             {id:'s-l',label:'L',order:4},{id:'s-xl',label:'XL',order:5},{id:'s-xxl',label:'XXL',order:6}] },
    { id:'sg-foot', name:'Footwear (UK)', appliesTo:['c-footwear','c-men-shoes','c-wom-foot'],
      sizes:[{id:'f-6',label:'6',order:1},{id:'f-7',label:'7',order:2},{id:'f-8',label:'8',order:3},
             {id:'f-9',label:'9',order:4},{id:'f-10',label:'10',order:5},{id:'f-11',label:'11',order:6}] },
    { id:'sg-waist', name:'Waist (inches)', appliesTo:['c-men-jeans'],
      sizes:[{id:'w-30',label:'30',order:1},{id:'w-32',label:'32',order:2},{id:'w-34',label:'34',order:3},{id:'w-36',label:'36',order:4}] },
    { id:'sg-cap', name:'Appliance Capacity', appliesTo:['c-ac','c-washing'],
      sizes:[{id:'a-1',label:'1.0 Ton',order:1},{id:'a-15',label:'1.5 Ton',order:2},{id:'a-2',label:'2.0 Ton',order:3}] }
  ];

  const attributes = [
    { id:'at-color', name:'Color', type:'Swatch', values:['Black','White','Navy','Beige','Olive','Silver','Blue'], usedIn:38, status:'Active' },
    { id:'at-material', name:'Material', type:'Dropdown', values:['Cotton','Denim','Leather','Mesh','Steel'], usedIn:21, status:'Active' },
    { id:'at-fit', name:'Fit', type:'Dropdown', values:['Slim','Regular','Relaxed'], usedIn:16, status:'Active' },
    { id:'at-warranty', name:'Warranty', type:'Text', values:['1 Year','2 Years','5 Years'], usedIn:29, status:'Active' },
    { id:'at-energy', name:'Energy Rating', type:'Dropdown', values:['3 Star','4 Star','5 Star'], usedIn:9, status:'Active' }
  ];

  /* ---------- products ---------- */
  const COLORS = { Black:'#1b1b25', White:'#f2f2f2', Navy:'#1e3a6e', Beige:'#d9c7a7', Olive:'#5c6b3f',
                   Silver:'#c9ccd2', Blue:'#2f6fd0', Red:'#c0392b', Grey:'#8b8b96' };

  function mkVariants(p) {
    const out = [];
    (p.colors || ['Default']).forEach(color => {
      (p.sizes || ['One Size']).forEach(size => {
        const stock = int(0, 48);
        out.push({
          id: `${p.id}-${color}-${size}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          sku: `${p.skuBase}-${color.slice(0,3).toUpperCase()}-${String(size).replace(/\s/g,'')}`,
          color, size,
          price: p.price + (size === 'XXL' || size === '2.0 Ton' ? 400 : 0),
          mrp: p.mrp + (size === 'XXL' || size === '2.0 Ton' ? 400 : 0),
          stock, reserved: int(0, 4), inTransit: int(0, 20), reorder: 10,
          barcode: '890' + int(1000000, 9999999),
          weight: p.weight, dims: p.dims,
          warehouse: pick(['WH-Mumbai', 'WH-Delhi', 'WH-Bengaluru']),
          status: stock === 0 ? 'Out of stock' : stock < 10 ? 'Low stock' : 'Active'
        });
      });
    });
    return out;
  }

  const rawProducts = [
    { id:'p1', name:'Nike Air Max Running Shoes', brand:'Nike', cat:'c-footwear', catName:'Footwear',
      price:7499, mrp:10999, rating:4.4, reviews:2841, skuBase:'NK-AM90', weight:'0.9 kg', dims:'32×22×12 cm',
      colors:['Black','White','Navy'], sizes:['6','7','8','9','10'], tags:['trending','recommended'],
      desc:'Lightweight everyday running shoe with responsive Air cushioning and a breathable engineered mesh upper.',
      specs:{ 'Upper':'Engineered mesh', 'Sole':'Rubber', 'Closure':'Lace-up', 'Cushioning':'Air Max unit', 'Warranty':'3 months' },
      seller:'Sportif Retail LLP', emoji:'👟' },
    { id:'p2', name:'Samsung 55" Crystal 4K Smart TV', brand:'Samsung', cat:'c-tv', catName:'Television',
      price:49999, mrp:74900, rating:4.5, reviews:1206, skuBase:'SM-TV55', weight:'14.5 kg', dims:'124×72×8 cm',
      colors:['Black'], sizes:['One Size'], tags:['trending','flash'], installService:'sv-appliance',
      desc:'55-inch Crystal 4K UHD display with Dynamic Crystal Colour, built-in voice assistants and slim bezel design.',
      specs:{ 'Display':'55" 4K UHD', 'Refresh Rate':'60 Hz', 'HDMI Ports':'3', 'OS':'Tizen', 'Warranty':'1 Year' },
      seller:'Digital World Electronics', emoji:'📺' },
    { id:'p3', name:'boAt Rockerz Wireless Headphones', brand:'boAt', cat:'c-audio', catName:'Audio',
      price:2499, mrp:4990, rating:4.2, reviews:9834, skuBase:'BT-RK550', weight:'0.28 kg', dims:'20×18×8 cm',
      colors:['Black','Blue','Beige'], sizes:['One Size'], tags:['flash','recommended','trending'],
      desc:'Over-ear Bluetooth headphones with 50-hour playback, ASAP fast charge and deep bass drivers.',
      specs:{ 'Driver':'40 mm', 'Battery':'50 hrs', 'Bluetooth':'v5.3', 'Mic':'Yes', 'Warranty':'1 Year' },
      seller:'AudioHub India', emoji:'🎧' },
    { id:'p4', name:'Prestige Iris Mixer Grinder 750W', brand:'Prestige', cat:'c-cook', catName:'Cookware',
      price:3799, mrp:5495, rating:4.3, reviews:4120, skuBase:'PR-MG750', weight:'4.2 kg', dims:'36×24×30 cm',
      colors:['White','Black'], sizes:['One Size'], tags:['recommended'],
      desc:'750W mixer grinder with 3 stainless steel jars, overload protection and 5-year motor warranty.',
      specs:{ 'Power':'750 W', 'Jars':'3', 'Speed':'3 + Pulse', 'Warranty':'2 Years' },
      seller:'HomeEssentials Retail', emoji:'🍹' },
    { id:'p5', name:'Lakmé Absolute Beauty Kit', brand:'Lakmé', cat:'c-makeup', catName:'Makeup',
      price:1299, mrp:1999, rating:4.1, reviews:2210, skuBase:'LK-ABK', weight:'0.5 kg', dims:'22×16×6 cm',
      colors:['Default'], sizes:['One Size'], tags:['flash','recommended'],
      desc:'Complete everyday makeup kit — lipstick, kajal, compact and highlighter in one gifting box.',
      specs:{ 'Items':'4', 'Shelf Life':'24 months', 'Skin Type':'All' },
      seller:'Beauty KeenPlaza', emoji:'💄' },
    { id:'p6', name:'LG 1.5 Ton 5 Star Split Inverter AC', brand:'LG', cat:'c-ac', catName:'Air Conditioners',
      price:42999, mrp:56990, rating:4.6, reviews:892, skuBase:'LG-AC15', weight:'38 kg', dims:'99×33×21 cm',
      colors:['White'], sizes:['1.0 Ton','1.5 Ton','2.0 Ton'], tags:['trending'], installService:'sv-ac',
      desc:'Dual inverter compressor AC with 4-way swing, HD filter and 5-star energy rating for lower bills.',
      specs:{ 'Capacity':'1.5 Ton', 'Energy':'5 Star', 'Compressor':'Dual Inverter', 'Warranty':'10 Yr Compressor' },
      seller:'CoolZone Appliances', emoji:'❄️' },
    { id:'p7', name:"Levi's 511 Slim Fit Jeans", brand:"Levi's", cat:'c-men-jeans', catName:'Jeans',
      price:2799, mrp:4499, rating:4.3, reviews:3391, skuBase:'LV-511', weight:'0.6 kg', dims:'32×24×5 cm',
      colors:['Navy','Black'], sizes:['30','32','34','36'], tags:['recommended','trending'],
      desc:'Slim-fit stretch denim that sits below the waist with a narrow leg — an everyday wardrobe staple.',
      specs:{ 'Fit':'Slim', 'Material':'99% Cotton, 1% Elastane', 'Rise':'Mid', 'Care':'Machine wash' },
      seller:'Denim Republic', emoji:'👖' },
    { id:'p8', name:'H&M Oversized Cotton Shirt', brand:'H&M', cat:'c-men-shirts', catName:'Shirts',
      price:1499, mrp:2299, rating:4.0, reviews:764, skuBase:'HM-OCS', weight:'0.3 kg', dims:'30×22×4 cm',
      colors:['White','Olive','Beige'], sizes:['S','M','L','XL'], tags:['recommended'],
      desc:'Relaxed oversized shirt in soft woven cotton with a resort collar and drop shoulders.',
      specs:{ 'Fit':'Oversized', 'Material':'100% Cotton', 'Sleeve':'Full', 'Care':'Machine wash cold' },
      seller:'Urban Threads', emoji:'👔' },
    { id:'p9', name:'Puma Everyday Backpack 22L', brand:'Puma', cat:'c-accessories', catName:'Accessories',
      price:1199, mrp:2499, rating:4.2, reviews:1508, skuBase:'PM-BP22', weight:'0.5 kg', dims:'45×30×18 cm',
      colors:['Black','Navy'], sizes:['One Size'], tags:['flash'],
      desc:'22-litre daypack with padded laptop sleeve, water-resistant base and breathable back panel.',
      specs:{ 'Capacity':'22 L', 'Laptop':'Up to 15"', 'Material':'Polyester', 'Warranty':'6 months' },
      seller:'Sportif Retail LLP', emoji:'🎒' },
    { id:'p10', name:'Samsung 7 Kg Front Load Washing Machine', brand:'Samsung', cat:'c-washing', catName:'Washing Machines',
      price:27990, mrp:38900, rating:4.4, reviews:642, skuBase:'SM-WM70', weight:'62 kg', dims:'60×55×85 cm',
      colors:['Silver','White'], sizes:['One Size'], tags:['recommended'], installService:'sv-appliance',
      desc:'Fully automatic front load washer with EcoBubble technology, hygiene steam and digital inverter motor.',
      specs:{ 'Capacity':'7 Kg', 'Type':'Front Load', 'Spin':'1200 RPM', 'Warranty':'10 Yr Motor' },
      seller:'CoolZone Appliances', emoji:'🧺' },
    { id:'p11', name:'Philips Water Purifier RO + UV', brand:'Philips', cat:'c-purifier', catName:'Water Purifiers',
      price:14499, mrp:21995, rating:4.3, reviews:415, skuBase:'PH-WP80', weight:'9 kg', dims:'38×26×48 cm',
      colors:['White'], sizes:['One Size'], tags:['recommended'], installService:'sv-appliance',
      desc:'8-litre RO + UV purifier with 5-stage filtration and micro-filtration for safe drinking water.',
      specs:{ 'Capacity':'8 L', 'Purification':'RO + UV', 'Stages':'5', 'Warranty':'1 Year' },
      seller:'PureLife Retail', emoji:'💧' },
    { id:'p12', name:'Sheesham Wood 3-Seater Sofa', brand:'Prestige', cat:'c-furniture', catName:'Furniture',
      price:24999, mrp:41999, rating:4.1, reviews:188, skuBase:'PR-SF3', weight:'48 kg', dims:'182×80×82 cm',
      colors:['Beige','Olive'], sizes:['One Size'], tags:['trending'], installService:'sv-carpenter',
      desc:'Solid sheesham frame 3-seater with high-density foam cushions and stain-resistant upholstery.',
      specs:{ 'Seating':'3', 'Frame':'Sheesham Wood', 'Assembly':'Required', 'Warranty':'2 Years' },
      seller:'HomeEssentials Retail', emoji:'🛋️' }
  ];

  const products = rawProducts.map(p => {
    const variants = mkVariants(p);
    const stock = variants.reduce((s, v) => s + v.stock, 0);
    return Object.assign({}, p, {
      variants, stock,
      discount: Math.round((1 - p.price / p.mrp) * 100),
      status: stock === 0 ? 'Out of stock' : 'Active',
      updated: daysAgo(int(0, 26)),
      images: 4,
      colorHex: (p.colors || []).map(c => COLORS[c] || '#999'),
      delivery: pick(['Tomorrow', 'in 2 days', 'in 3 days']),
      express: rnd() > .5
    });
  });

  /* ---------- services (Urban Company style) ---------- */
  const serviceCategories = [
    { id:'sv-salon', name:'Salon at Home', icon:'💇', desc:'Beauty and grooming, at your doorstep.', rating:4.8, bookings:'12k', color:'#F472B6' },
    { id:'sv-clean', name:'Home Cleaning', icon:'🧼', desc:'Deep cleaning by trained professionals.', rating:4.7, bookings:'9.4k', color:'#38BDF8' },
    { id:'sv-ac', name:'AC Service & Repair', icon:'❄️', desc:'Service, gas refill, install and repair.', rating:4.8, bookings:'21k', color:'#22D3EE' },
    { id:'sv-appliance', name:'Appliance Repair', icon:'🔧', desc:'TV, washing machine, fridge, purifier.', rating:4.6, bookings:'7.1k', color:'#A78BFA' },
    { id:'sv-electric', name:'Electrician', icon:'💡', desc:'Wiring, switches, fans and fittings.', rating:4.7, bookings:'15k', color:'#FBBF24' },
    { id:'sv-plumb', name:'Plumber', icon:'🚿', desc:'Leaks, taps, drainage and fittings.', rating:4.6, bookings:'11k', color:'#60A5FA' },
    { id:'sv-paint', name:'Painting', icon:'🎨', desc:'Full home and room-wise painting.', rating:4.5, bookings:'2.3k', color:'#34D399' },
    { id:'sv-pest', name:'Pest Control', icon:'🐜', desc:'Cockroach, termite and general pest.', rating:4.6, bookings:'4.8k', color:'#FB7185' },
    { id:'sv-carpenter', name:'Home Repair & Assembly', icon:'🪚', desc:'Furniture assembly and carpentry.', rating:4.5, bookings:'3.6k', color:'#F59E0B' }
  ];

  const servicePackages = [
    { id:'pk-ac-basic', catId:'sv-ac', name:'Basic AC Service', price:499, mrp:699, duration:'45 mins', rating:4.8, reviews:8421,
      desc:'Foam-jet cleaning of the indoor unit, filter wash and cooling performance check.',
      includes:['Filter and coil foam-jet cleaning','Drain pipe cleaning','Cooling and gas pressure check','Post-service surface wipe'],
      excludes:['Gas refill','Spare parts','Uninstall / install work'] },
    { id:'pk-ac-deep', catId:'sv-ac', name:'Deep AC Service', price:899, mrp:1199, duration:'90 mins', rating:4.9, reviews:3120,
      desc:'Complete indoor + outdoor unit deep clean with jet-pump water pressure.',
      includes:['Indoor + outdoor unit deep clean','Jet-pump coil wash','Drain and blower cleaning','Cooling and electrical check'],
      excludes:['Gas refill','Spare parts'] },
    { id:'pk-ac-repair', catId:'sv-ac', name:'AC Repair Visit', price:299, mrp:399, duration:'30 mins', rating:4.6, reviews:2044,
      desc:'Diagnostic visit — fault detection and on-the-spot estimate. Visit fee adjusted against repair.',
      includes:['Fault diagnosis','Repair estimate','30-day service warranty on repair'],
      excludes:['Spare parts cost','Gas refill'] },
    { id:'pk-ac-install', catId:'sv-ac', name:'AC Installation', price:1499, mrp:1999, duration:'2 hrs', rating:4.8, reviews:5610,
      desc:'Split AC installation with standard copper piping up to 3 metres.', bundleFor:['c-ac'],
      includes:['Indoor + outdoor unit mounting','Up to 3m copper piping','Gas pressure check','Demo and trial run'],
      excludes:['Extra piping beyond 3m','Core cutting','Stabiliser'] },
    { id:'pk-appl-install', catId:'sv-appliance', name:'Appliance Installation & Demo', price:799, mrp:999, duration:'60 mins', rating:4.7, reviews:1810,
      desc:'Installation, first-run demo and setup for TV, washing machine or purifier.', bundleFor:['c-tv','c-washing','c-purifier'],
      includes:['Unboxing and placement','Wall mount / levelling','Connection and trial run','Usage demo'],
      excludes:['Wall mount bracket','Additional plumbing lines'] },
    { id:'pk-appl-repair', catId:'sv-appliance', name:'Appliance Repair Visit', price:349, mrp:499, duration:'45 mins', rating:4.5, reviews:1240,
      desc:'Technician visit for diagnosis of TV, washer, fridge or purifier faults.',
      includes:['Fault diagnosis','Written estimate','30-day repair warranty'], excludes:['Spare parts'] },
    { id:'pk-clean-1bhk', catId:'sv-clean', name:'Full Home Deep Clean — 1 BHK', price:2499, mrp:3299, duration:'4 hrs', rating:4.7, reviews:4310,
      desc:'Two-professional deep clean covering all rooms, kitchen and bathrooms.',
      includes:['Bathroom descaling','Kitchen degreasing','Floor scrubbing','Dusting and cobweb removal'],
      excludes:['Sofa / mattress shampoo','Exterior window facades'] },
    { id:'pk-clean-bath', catId:'sv-clean', name:'Bathroom Deep Cleaning', price:499, mrp:699, duration:'60 mins', rating:4.6, reviews:6120,
      desc:'Descaling and disinfection of tiles, fittings and sanitary ware.',
      includes:['Tile descaling','Fittings polish','Disinfection','Drain cleaning'], excludes:['Plumbing repairs'] },
    { id:'pk-salon-glow', catId:'sv-salon', name:'Glow Facial + Cleanup', price:1099, mrp:1499, duration:'75 mins', rating:4.8, reviews:7420,
      desc:'Salon-grade facial using sealed, single-use products brought by the professional.',
      includes:['Cleanup and exfoliation','Facial massage','Mask and pack','Single-use kit'], excludes:['Hair services'] },
    { id:'pk-salon-wax', catId:'sv-salon', name:'Waxing — Full Arms & Legs', price:849, mrp:1099, duration:'60 mins', rating:4.7, reviews:5210,
      desc:'Roll-on waxing with disposable cartridges.',
      includes:['Full arms','Full legs','Underarms','Post-wax care'], excludes:['Facial waxing'] },
    { id:'pk-elec-visit', catId:'sv-electric', name:'Electrician Visit', price:199, mrp:299, duration:'30 mins', rating:4.7, reviews:9310,
      desc:'Standard visit for switch, socket, fan or light work. Material charged extra.',
      includes:['Inspection','Minor fitting work','Estimate for parts'], excludes:['Material cost','Full rewiring'] },
    { id:'pk-elec-fan', catId:'sv-electric', name:'Fan Installation', price:249, mrp:349, duration:'30 mins', rating:4.6, reviews:2210,
      desc:'Ceiling fan installation with existing wiring point.', bundleFor:['c-appliances'],
      includes:['Fan mounting','Wiring connection','Balance and trial'], excludes:['New wiring point','Down rod'] },
    { id:'pk-plumb-visit', catId:'sv-plumb', name:'Plumber Visit', price:199, mrp:299, duration:'30 mins', rating:4.6, reviews:6120,
      desc:'Tap, flush, leakage or drainage inspection and minor fix.',
      includes:['Inspection','Minor fix','Parts estimate'], excludes:['Material cost'] },
    { id:'pk-paint-room', catId:'sv-paint', name:'Room Painting (per room)', price:4999, mrp:6499, duration:'1–2 days', rating:4.5, reviews:820,
      desc:'Putty, primer and two coats of emulsion for one standard room.',
      includes:['Surface prep','Primer + 2 coats','Furniture covering','Post-work cleanup'], excludes:['Premium paint upgrade','Waterproofing'] },
    { id:'pk-pest-general', catId:'sv-pest', name:'General Pest Control', price:1299, mrp:1799, duration:'90 mins', rating:4.6, reviews:2410,
      desc:'Odourless gel and spray treatment for cockroaches and ants, with 90-day warranty.',
      includes:['Gel treatment','Spray treatment','90-day warranty'], excludes:['Termite treatment'] },
    { id:'pk-carp-assembly', catId:'sv-carpenter', name:'Furniture Assembly', price:699, mrp:999, duration:'90 mins', rating:4.6, reviews:1420,
      desc:'Assembly of flat-pack furniture — beds, tables, wardrobes and sofas.', bundleFor:['c-furniture'],
      includes:['Assembly as per manual','Levelling and alignment','Packaging disposal'], excludes:['Wall drilling for anchors'] },
    { id:'pk-ac-amc', catId:'sv-ac', name:'Annual AC Maintenance (3 visits)', price:1999, mrp:2799, duration:'Yearly plan', rating:4.8, reviews:940,
      subscription:true, desc:'Three scheduled services a year with priority slot booking.',
      includes:['3 scheduled services','Priority slots','Free gas pressure check','10% off repairs'], excludes:['Spare parts','Gas refill'] }
  ];

  const professionals = [
    { id:'pro1', name:'Ramesh Kadam', photo:'RK', rating:4.9, jobs:1284, exp:'8 yrs', cats:['sv-ac','sv-appliance'],
      skills:['AC Service','Gas Refill','Installation'], area:'Mumbai — Andheri, Bandra', verified:true, status:'Active', availability:'Available' },
    { id:'pro2', name:'Sunita Deshmukh', photo:'SD', rating:4.8, jobs:962, exp:'6 yrs', cats:['sv-salon'],
      skills:['Facial','Waxing','Threading'], area:'Mumbai — Powai, Vikhroli', verified:true, status:'Active', availability:'Busy' },
    { id:'pro3', name:'Imran Shaikh', photo:'IS', rating:4.7, jobs:1571, exp:'11 yrs', cats:['sv-electric','sv-appliance'],
      skills:['Wiring','Fan Install','Switchboard'], area:'Delhi — Saket, Hauz Khas', verified:true, status:'Active', availability:'Available' },
    { id:'pro4', name:'Vijay Nair', photo:'VN', rating:4.6, jobs:684, exp:'4 yrs', cats:['sv-plumb'],
      skills:['Leak Fix','Drainage','Tap Fitting'], area:'Bengaluru — Indiranagar', verified:true, status:'Active', availability:'Available' },
    { id:'pro5', name:'Anjali Rao', photo:'AR', rating:4.8, jobs:432, exp:'3 yrs', cats:['sv-clean'],
      skills:['Deep Clean','Kitchen','Bathroom'], area:'Pune — Kothrud', verified:false, status:'Pending', availability:'Offline' },
    { id:'pro6', name:'Manoj Yadav', photo:'MY', rating:4.5, jobs:311, exp:'5 yrs', cats:['sv-paint','sv-carpenter'],
      skills:['Emulsion','Putty','Assembly'], area:'Ahmedabad — Satellite', verified:true, status:'Active', availability:'On Job' },
    { id:'pro7', name:'Deepak Chauhan', photo:'DC', rating:4.7, jobs:889, exp:'7 yrs', cats:['sv-pest','sv-clean'],
      skills:['Gel Treatment','Termite','Sanitisation'], area:'Surat — Adajan', verified:true, status:'Blocked', availability:'Offline' }
  ];

  const serviceAreas = [
    { id:'sa1', city:'Mumbai', pincodes:'400001–400104', pros:142, cats:9, status:'Live', slots:'07:00–21:00' },
    { id:'sa2', city:'Delhi NCR', pincodes:'110001–110096', pros:118, cats:9, status:'Live', slots:'08:00–21:00' },
    { id:'sa3', city:'Bengaluru', pincodes:'560001–560103', pros:96, cats:8, status:'Live', slots:'08:00–20:00' },
    { id:'sa4', city:'Pune', pincodes:'411001–411062', pros:54, cats:7, status:'Live', slots:'09:00–20:00' },
    { id:'sa5', city:'Ahmedabad', pincodes:'380001–380063', pros:38, cats:6, status:'Live', slots:'09:00–20:00' },
    { id:'sa6', city:'Surat', pincodes:'395001–395010', pros:21, cats:5, status:'Pilot', slots:'10:00–19:00' },
    { id:'sa7', city:'Jaipur', pincodes:'302001–302039', pros:0, cats:0, status:'Planned', slots:'—' }
  ];

  const timeSlots = ['09:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM','07:00 PM'];

  /* ---------- customers ---------- */
  const customers = [
    { id:'u1', name:'Aarav Sharma', email:'aarav.sharma@example.in', phone:'+91 98200 41122', city:'Mumbai',
      orders:14, spent:128450, last:daysAgo(2), status:'Active', joined:daysAgo(420), bookings:5, wallet:1250, segment:'VIP' },
    { id:'u2', name:'Riya Patel', email:'riya.patel@example.in', phone:'+91 99251 77840', city:'Ahmedabad',
      orders:9, spent:64300, last:daysAgo(5), status:'Active', joined:daysAgo(310), bookings:3, wallet:480, segment:'Loyal' },
    { id:'u3', name:'Rahul Verma', email:'rahul.verma@example.in', phone:'+91 98110 22319', city:'Delhi',
      orders:22, spent:214900, last:daysAgo(1), status:'Active', joined:daysAgo(690), bookings:11, wallet:3200, segment:'VIP' },
    { id:'u4', name:'Neha Shah', email:'neha.shah@example.in', phone:'+91 90999 34410', city:'Surat',
      orders:4, spent:18700, last:daysAgo(18), status:'Active', joined:daysAgo(120), bookings:1, wallet:0, segment:'New' },
    { id:'u5', name:'Karthik Iyer', email:'karthik.iyer@example.in', phone:'+91 98450 61207', city:'Bengaluru',
      orders:16, spent:97800, last:daysAgo(3), status:'Active', joined:daysAgo(500), bookings:7, wallet:760, segment:'Loyal' },
    { id:'u6', name:'Ananya Reddy', email:'ananya.reddy@example.in', phone:'+91 91000 55823', city:'Hyderabad',
      orders:2, spent:6400, last:daysAgo(46), status:'Inactive', joined:daysAgo(210), bookings:0, wallet:0, segment:'At Risk' },
    { id:'u7', name:'Siddharth Joshi', email:'sid.joshi@example.in', phone:'+91 88880 12093', city:'Pune',
      orders:7, spent:41250, last:daysAgo(9), status:'Active', joined:daysAgo(260), bookings:4, wallet:150, segment:'Loyal' },
    { id:'u8', name:'Meera Nair', email:'meera.nair@example.in', phone:'+91 97010 88342', city:'Kochi',
      orders:1, spent:2499, last:daysAgo(64), status:'Blocked', joined:daysAgo(90), bookings:0, wallet:0, segment:'At Risk' }
  ];

  const segments = [
    { id:'sg1', name:'VIP Customers', rule:'Lifetime spend > ₹1,00,000', size:142, growth:'+8%', channel:'Push, Email' },
    { id:'sg2', name:'Cart Abandoners (7d)', rule:'Cart created, no order in 7 days', size:1840, growth:'+12%', channel:'Push, WhatsApp' },
    { id:'sg3', name:'Appliance Buyers — No Service', rule:'Bought appliance, never booked service', size:962, growth:'+21%', channel:'Push, SMS' },
    { id:'sg4', name:'Lapsed 60 Days', rule:'No order in 60 days', size:3410, growth:'-4%', channel:'Email' },
    { id:'sg5', name:'Service Repeat Due', rule:'AC service older than 6 months', size:588, growth:'+16%', channel:'Push, WhatsApp' }
  ];

  /* ---------- orders ---------- */
  const orderStatuses = ['Placed','Confirmed','Packed','Shipped','Out for Delivery','Delivered','Cancelled','Returned','Refunded'];
  const statusTone = { Placed:'info', Confirmed:'info', Packed:'primary', Shipped:'primary', 'Out for Delivery':'warning',
    Delivered:'success', Cancelled:'error', Returned:'warning', Refunded:'neutral',
    Active:'success', Draft:'neutral', Inactive:'neutral', Blocked:'error', Pending:'warning', Expired:'neutral',
    Scheduled:'info', 'In stock':'success', 'Low stock':'warning', 'Out of stock':'error', Overstocked:'info',
    'Booking Confirmed':'info', 'Professional Assigned':'primary', 'On The Way':'warning',
    'Service Started':'primary', 'Service Completed':'success', Live:'success', Pilot:'warning', Planned:'neutral',
    Paid:'success', Failed:'error', Enabled:'success', Disabled:'neutral', VIP:'primary', Loyal:'info',
    New:'success', 'At Risk':'warning', Available:'success', Busy:'warning', 'On Job':'primary', Offline:'neutral' };

  const couriers = ['Delhivery','Blue Dart','Shiprocket','Ecom Express','DTDC'];

  const orders = [
    { id:'BZ100241', customer:'u3', date:daysAgo(0), status:'Out for Delivery', total:52498, payment:'UPI', city:'Delhi',
      courier:'Delhivery', awb:'DL2914772819', channel:'Web', delayed:false,
      items:[{ pid:'p2', variant:'Black / One Size', qty:1, price:49999 }, { type:'service', pid:'pk-appl-install', qty:1, price:799 }],
      hasService:true },
    { id:'BZ100240', customer:'u1', date:daysAgo(1), status:'Shipped', total:44498, payment:'Credit Card', city:'Mumbai',
      courier:'Blue Dart', awb:'BD8842019233', channel:'Mobile App', delayed:true,
      items:[{ pid:'p6', variant:'White / 1.5 Ton', qty:1, price:42999 }, { type:'service', pid:'pk-ac-install', qty:1, price:1499 }],
      hasService:true },
    { id:'BZ100239', customer:'u5', date:daysAgo(1), status:'Packed', total:9998, payment:'Wallet', city:'Bengaluru',
      courier:'Shiprocket', awb:'SR1029384756', channel:'Web', delayed:false,
      items:[{ pid:'p1', variant:'Black / 9', qty:1, price:7499 }, { pid:'p3', variant:'Blue / One Size', qty:1, price:2499 }] },
    { id:'BZ100238', customer:'u2', date:daysAgo(2), status:'Delivered', total:3799, payment:'COD', city:'Ahmedabad',
      courier:'DTDC', awb:'DT7719003411', channel:'Mobile App', delayed:false,
      items:[{ pid:'p4', variant:'White / One Size', qty:1, price:3799 }] },
    { id:'BZ100237', customer:'u7', date:daysAgo(3), status:'Delivered', total:4298, payment:'UPI', city:'Pune',
      courier:'Delhivery', awb:'DL2914001188', channel:'Web', delayed:false,
      items:[{ pid:'p7', variant:'Navy / 32', qty:1, price:2799 }, { pid:'p5', variant:'Default / One Size', qty:1, price:1299 }] },
    { id:'BZ100236', customer:'u4', date:daysAgo(4), status:'Cancelled', total:1499, payment:'UPI', city:'Surat',
      courier:'—', awb:'—', channel:'Mobile App', delayed:false,
      items:[{ pid:'p8', variant:'Olive / M', qty:1, price:1499 }] },
    { id:'BZ100235', customer:'u1', date:daysAgo(6), status:'Delivered', total:28789, payment:'Net Banking', city:'Mumbai',
      courier:'Ecom Express', awb:'EE5501992844', channel:'Web', delayed:false,
      items:[{ pid:'p10', variant:'Silver / One Size', qty:1, price:27990 }, { type:'service', pid:'pk-appl-install', qty:1, price:799 }],
      hasService:true },
    { id:'BZ100234', customer:'u6', date:daysAgo(9), status:'Returned', total:2499, payment:'Debit Card', city:'Hyderabad',
      courier:'Blue Dart', awb:'BD8842011922', channel:'Web', delayed:false,
      items:[{ pid:'p3', variant:'Black / One Size', qty:1, price:2499 }] },
    { id:'BZ100233', customer:'u5', date:daysAgo(11), status:'Refunded', total:1199, payment:'UPI', city:'Bengaluru',
      courier:'Delhivery', awb:'DL2913882011', channel:'Mobile App', delayed:false,
      items:[{ pid:'p9', variant:'Black / One Size', qty:1, price:1199 }] },
    { id:'BZ100232', customer:'u3', date:daysAgo(13), status:'Delivered', total:24999, payment:'Credit Card', city:'Delhi',
      courier:'Shiprocket', awb:'SR1029111003', channel:'Web', delayed:false,
      items:[{ pid:'p12', variant:'Beige / One Size', qty:1, price:24999 }] }
  ];

  const orderTimeline = [
    { key:'Placed', label:'Order Confirmed', note:'We received your order' },
    { key:'Packed', label:'Packed', note:'Item packed at fulfilment centre' },
    { key:'Shipped', label:'Picked Up', note:'Handed over to courier partner' },
    { key:'Shipped2', label:'In Transit', note:'Moving to your city hub' },
    { key:'Out for Delivery', label:'Out for Delivery', note:'Arriving today' },
    { key:'Delivered', label:'Delivered', note:'Delivered to customer' }
  ];

  const bookingTimeline = [
    { key:'Booking Confirmed', label:'Booking Confirmed', note:'Slot locked' },
    { key:'Professional Assigned', label:'Professional Assigned', note:'Partner allocated' },
    { key:'On The Way', label:'Professional On The Way', note:'Live tracking available' },
    { key:'Service Started', label:'Service Started', note:'Work in progress' },
    { key:'Service Completed', label:'Service Completed', note:'Job done' },
    { key:'Rating', label:'Rating & Payment', note:'Rate your experience' }
  ];

  const bookings = [
    { id:'SB50019', customer:'u1', pkg:'pk-ac-install', date:daysAgo(0), slot:'11:00 AM', status:'Professional Assigned',
      pro:'pro1', amount:1499, city:'Mumbai', address:'Home — Andheri West', fromOrder:'BZ100240' },
    { id:'SB50018', customer:'u3', pkg:'pk-appl-install', date:daysAgo(0), slot:'03:00 PM', status:'Booking Confirmed',
      pro:null, amount:799, city:'Delhi', address:'Home — Saket', fromOrder:'BZ100241' },
    { id:'SB50017', customer:'u5', pkg:'pk-clean-1bhk', date:daysAgo(1), slot:'09:00 AM', status:'Service Completed',
      pro:'pro5', amount:2499, city:'Bengaluru', address:'Home — Indiranagar' },
    { id:'SB50016', customer:'u7', pkg:'pk-salon-glow', date:daysAgo(2), slot:'05:00 PM', status:'Service Completed',
      pro:'pro2', amount:1099, city:'Pune', address:'Home — Kothrud' },
    { id:'SB50015', customer:'u2', pkg:'pk-elec-fan', date:daysAgo(3), slot:'01:00 PM', status:'Cancelled',
      pro:'pro3', amount:249, city:'Ahmedabad', address:'Office — Satellite' },
    { id:'SB50014', customer:'u1', pkg:'pk-ac-basic', date:daysAgo(5), slot:'11:00 AM', status:'Service Completed',
      pro:'pro1', amount:499, city:'Mumbai', address:'Home — Andheri West' },
    { id:'SB50013', customer:'u5', pkg:'pk-pest-general', date:daysAgo(8), slot:'09:00 AM', status:'Service Completed',
      pro:'pro7', amount:1299, city:'Bengaluru', address:'Home — Indiranagar' }
  ];

  /* ---------- marketing ---------- */
  const coupons = [
    { id:'cp1', code:'WELCOME20', type:'Percentage', value:20, maxDiscount:500, minCart:999, used:1842, limit:5000,
      start:daysAgo(60), end:daysAgo(-40), status:'Active', applies:'First order only', scope:'All products' },
    { id:'cp2', code:'SAVE500', type:'Flat', value:500, maxDiscount:500, minCart:2999, used:964, limit:2000,
      start:daysAgo(30), end:daysAgo(-15), status:'Active', applies:'All customers', scope:'Electronics' },
    { id:'cp3', code:'FREESHIP', type:'Free Shipping', value:0, maxDiscount:99, minCart:499, used:5210, limit:0,
      start:daysAgo(90), end:daysAgo(-90), status:'Active', applies:'All customers', scope:'All products' },
    { id:'cp4', code:'FESTIVE15', type:'Percentage', value:15, maxDiscount:2000, minCart:4999, used:412, limit:1000,
      start:daysAgo(5), end:daysAgo(-25), status:'Active', applies:'All customers', scope:'Fashion + Appliances' },
    { id:'cp5', code:'SERVICE100', type:'Flat', value:100, maxDiscount:100, minCart:299, used:288, limit:1500,
      start:daysAgo(12), end:daysAgo(-30), status:'Active', applies:'All customers', scope:'Services only' },
    { id:'cp6', code:'SUMMER10', type:'Percentage', value:10, maxDiscount:300, minCart:999, used:2201, limit:2200,
      start:daysAgo(180), end:daysAgo(20), status:'Expired', applies:'All customers', scope:'All products' }
  ];

  const offers = [
    { id:'of1', name:'Electronics Fest — Flat 25% Off', type:'Category discount', value:'25%', minCart:4999, maxDiscount:8000,
      start:daysAgo(4), end:daysAgo(-10), applies:'Electronics', users:'All', used:1420, limit:0, status:'Active' },
    { id:'of2', name:'Buy 1 Get 1 — Fashion Tees', type:'Buy 1 Get 1', value:'BOGO', minCart:0, maxDiscount:1499,
      start:daysAgo(2), end:daysAgo(-12), applies:'Fashion > Men', users:'All', used:388, limit:1000, status:'Active' },
    { id:'of3', name:'Flat ₹500 Off Appliances', type:'Flat discount', value:'₹500', minCart:9999, maxDiscount:500,
      start:daysAgo(20), end:daysAgo(-5), applies:'Appliances', users:'All', used:642, limit:2000, status:'Active' },
    { id:'of4', name:'Free Shipping Weekend', type:'Free shipping', value:'₹0 delivery', minCart:499, maxDiscount:99,
      start:daysAgo(1), end:daysAgo(-2), applies:'All', users:'All', used:2210, limit:0, status:'Active' },
    { id:'of5', name:'AC + Installation Bundle', type:'Cart-level discount', value:'₹1,000 off', minCart:29999, maxDiscount:1000,
      start:daysAgo(8), end:daysAgo(-22), applies:'Appliances + Services', users:'All', used:180, limit:500, status:'Active' },
    { id:'of6', name:'Brand Days — Nike 30%', type:'Brand discount', value:'30%', minCart:2999, maxDiscount:3000,
      start:daysAgo(45), end:daysAgo(10), applies:'Nike', users:'All', used:910, limit:1200, status:'Expired' },
    { id:'of7', name:'VIP Early Access', type:'Product discount', value:'12%', minCart:0, maxDiscount:5000,
      start:daysAgo(-3), end:daysAgo(-30), applies:'Selected products', users:'VIP segment', used:0, limit:400, status:'Scheduled' }
  ];

  const campaigns = [
    { id:'cm1', title:'Weekend Sale 🎉', message:'Get up to 40% off selected products.', audience:'All Customers',
      channel:'Push', sent:48200, opened:'22.4%', clicked:'6.1%', date:daysAgo(1), status:'Active' },
    { id:'cm2', title:'Your AC service is due', message:'6 months since your last AC service. Book now at ₹499.',
      audience:'Service Repeat Due', channel:'WhatsApp', sent:588, opened:'61.2%', clicked:'18.4%', date:daysAgo(3), status:'Active' },
    { id:'cm3', title:'Left something behind?', message:'Your cart is waiting. Complete the order in one tap.',
      audience:'Cart Abandoners (7d)', channel:'Push, Email', sent:1840, opened:'31.0%', clicked:'9.8%', date:daysAgo(2), status:'Active' },
    { id:'cm4', title:'Installation in 24 hours', message:'Bought an appliance? Add professional installation from ₹799.',
      audience:'Appliance Buyers — No Service', channel:'SMS', sent:962, opened:'—', clicked:'4.2%', date:daysAgo(6), status:'Completed' },
    { id:'cm5', title:'Festive Preview', message:'VIP early access opens tomorrow, 10 AM.', audience:'VIP Customers',
      channel:'Push', sent:0, opened:'—', clicked:'—', date:daysAgo(-1), status:'Scheduled' }
  ];

  const notificationTriggers = [
    { id:'nt1', event:'Order Placed', push:true, email:true, sms:true, whatsapp:false, inapp:true, template:'Order {{id}} confirmed' },
    { id:'nt2', event:'Order Shipped', push:true, email:true, sms:false, whatsapp:true, inapp:true, template:'Shipped via {{courier}}' },
    { id:'nt3', event:'Out for Delivery', push:true, email:false, sms:true, whatsapp:true, inapp:true, template:'Arriving today' },
    { id:'nt4', event:'Delivered', push:true, email:true, sms:false, whatsapp:false, inapp:true, template:'Delivered — rate it' },
    { id:'nt5', event:'Order Cancelled', push:true, email:true, sms:true, whatsapp:false, inapp:true, template:'Order cancelled' },
    { id:'nt6', event:'Refund Processed', push:true, email:true, sms:true, whatsapp:false, inapp:true, template:'₹{{amount}} refunded' },
    { id:'nt7', event:'Offer Available', push:true, email:true, sms:false, whatsapp:false, inapp:true, template:'New offer for you' },
    { id:'nt8', event:'Cart Abandoned', push:true, email:true, sms:false, whatsapp:true, inapp:false, template:'Still thinking?' },
    { id:'nt9', event:'Price Drop', push:true, email:false, sms:false, whatsapp:false, inapp:true, template:'Price dropped {{pct}}%' },
    { id:'nt10', event:'Back in Stock', push:true, email:true, sms:false, whatsapp:false, inapp:true, template:'Back in stock' },
    { id:'nt11', event:'Service Booking Confirmed', push:true, email:true, sms:true, whatsapp:true, inapp:true, template:'Booking {{id}} confirmed' },
    { id:'nt12', event:'Professional Assigned', push:true, email:false, sms:true, whatsapp:true, inapp:true, template:'{{pro}} assigned' },
    { id:'nt13', event:'Professional Arriving', push:true, email:false, sms:true, whatsapp:true, inapp:true, template:'Arriving in 15 mins' },
    { id:'nt14', event:'Service Completed', push:true, email:true, sms:false, whatsapp:true, inapp:true, template:'Rate your service' }
  ];

  const customerNotifications = [
    { id:'n1', title:'Out for delivery', body:'Order BZ100241 arrives today by 7 PM.', time:'12 min ago', icon:'🚚', unread:true },
    { id:'n2', title:'Professional assigned', body:'Ramesh K. will service your AC at 11:00 AM.', time:'1 hr ago', icon:'🧰', unread:true },
    { id:'n3', title:'Price drop', body:'boAt Rockerz is now ₹2,499 — down 12%.', time:'5 hrs ago', icon:'📉', unread:true },
    { id:'n4', title:'Weekend Sale 🎉', body:'Up to 40% off on selected products.', time:'Yesterday', icon:'🎁', unread:false },
    { id:'n5', title:'Refund processed', body:'₹1,199 credited to your UPI account.', time:'2 days ago', icon:'💰', unread:false }
  ];

  /* ---------- logistics ---------- */
  const shippingProviders = [
    { id:'sp1', name:'Delhivery', enabled:true, priority:1, apiKey:'dlv_test_••••••••4f21', secret:'••••••••••••', base:'https://api.demo-delhivery.test/v1',
      serviceability:'19,842 pincodes', cod:true, avgDays:2.4, tested:'Connected' },
    { id:'sp2', name:'Blue Dart', enabled:true, priority:2, apiKey:'bd_test_••••••••9a07', secret:'••••••••••••', base:'https://api.demo-bluedart.test/v2',
      serviceability:'16,210 pincodes', cod:true, avgDays:1.9, tested:'Connected' },
    { id:'sp3', name:'Shiprocket', enabled:true, priority:3, apiKey:'sr_test_••••••••1c88', secret:'••••••••••••', base:'https://api.demo-shiprocket.test/v1',
      serviceability:'24,110 pincodes', cod:true, avgDays:3.1, tested:'Connected' },
    { id:'sp4', name:'Ecom Express', enabled:true, priority:4, apiKey:'ecom_test_••••••••7b13', secret:'••••••••••••', base:'https://api.demo-ecomexpress.test/v1',
      serviceability:'21,004 pincodes', cod:false, avgDays:2.8, tested:'Connected' },
    { id:'sp5', name:'DTDC', enabled:false, priority:5, apiKey:'dtdc_test_••••••••2e55', secret:'••••••••••••', base:'https://api.demo-dtdc.test/v1',
      serviceability:'14,760 pincodes', cod:true, avgDays:3.6, tested:'Not tested' }
  ];

  const shipments = orders.filter(o => o.awb !== '—').map((o, i) => ({
    id:'SHP' + (9010 + i), order:o.id, courier:o.courier, awb:o.awb, city:o.city,
    status:o.status === 'Delivered' ? 'Delivered' : o.status === 'Returned' ? 'Returned' : o.status,
    eta:o.status === 'Delivered' ? '—' : 'in ' + int(1, 3) + ' days', weight:(rnd() * 10 + .5).toFixed(1) + ' kg',
    cost:int(60, 480), delayed:o.delayed
  }));

  const warehouses = [
    { id:'wh1', name:'WH-Mumbai', city:'Mumbai', pincode:'400072', skus:842, units:14210, capacity:78, status:'Active', manager:'Aarav Sharma' },
    { id:'wh2', name:'WH-Delhi', city:'Delhi', pincode:'110044', skus:756, units:11840, capacity:64, status:'Active', manager:'Rahul Verma' },
    { id:'wh3', name:'WH-Bengaluru', city:'Bengaluru', pincode:'560099', skus:611, units:9320, capacity:52, status:'Active', manager:'Karthik Iyer' },
    { id:'wh4', name:'WH-Surat (Dark Store)', city:'Surat', pincode:'395009', skus:210, units:2140, capacity:31, status:'Pilot', manager:'Neha Shah' }
  ];

  const stockHistory = [
    { id:'sh1', date:daysAgo(0), sku:'LG-AC15-WHI-1.5Ton', type:'Sale', qty:-1, by:'System', note:'Order BZ100240' },
    { id:'sh2', date:daysAgo(0), sku:'SM-TV55-BLA-OneSize', type:'Sale', qty:-1, by:'System', note:'Order BZ100241' },
    { id:'sh3', date:daysAgo(1), sku:'NK-AM90-BLA-9', type:'Adjustment', qty:+24, by:'Inventory Manager', note:'GRN #4471' },
    { id:'sh4', date:daysAgo(2), sku:'BT-RK550-BLU-OneSize', type:'Transfer', qty:-15, by:'Inventory Manager', note:'WH-Mumbai → WH-Delhi' },
    { id:'sh5', date:daysAgo(3), sku:'PR-MG750-WHI-OneSize', type:'Return', qty:+1, by:'Support', note:'RTO BZ100234' },
    { id:'sh6', date:daysAgo(4), sku:'HM-OCS-OLI-M', type:'Adjustment', qty:-3, by:'Inventory Manager', note:'Damage write-off' }
  ];

  /* ---------- reviews ---------- */
  const reviews = [
    { id:'rv1', pid:'p1', user:'Aarav Sharma', rating:5, title:'Superb comfort', date:daysAgo(3), status:'Published',
      body:'Wore these for a 10 km run on day one. Zero break-in needed, cushioning is excellent.', verified:true },
    { id:'rv2', pid:'p1', user:'Karthik Iyer', rating:4, title:'Runs slightly small', date:daysAgo(9), status:'Published',
      body:'Great shoe overall, but order half a size up if you have wide feet.', verified:true },
    { id:'rv3', pid:'p3', user:'Riya Patel', rating:5, title:'Battery is unreal', date:daysAgo(6), status:'Published',
      body:'Charged once in ten days of daily commute use. Bass is punchy for the price.', verified:true },
    { id:'rv4', pid:'p6', user:'Rahul Verma', rating:5, title:'Cooling is fast', date:daysAgo(12), status:'Published',
      body:'Room cools in under 6 minutes. Installation was booked with the AC itself — very convenient.', verified:true },
    { id:'rv5', pid:'p2', user:'Neha Shah', rating:3, title:'Good picture, average sound', date:daysAgo(15), status:'Pending',
      body:'Panel quality is good but I had to add a soundbar.', verified:false },
    { id:'rv6', pid:'p4', user:'Siddharth Joshi', rating:4, title:'Solid workhorse', date:daysAgo(20), status:'Published',
      body:'Handles wet grinding well. A little loud at top speed.', verified:true }
  ];

  /* ---------- settings / integrations / roles ---------- */
  const paymentGateways = [
    { id:'pg1', name:'Razorpay', mode:'Test', enabled:true, methods:'UPI, Cards, Netbanking, Wallets', fee:'2.0%', key:'rzp_test_••••••••Q1x' },
    { id:'pg2', name:'Cashfree', mode:'Test', enabled:true, methods:'UPI, Cards, COD reconciliation', fee:'1.9%', key:'cf_test_••••••••8Kd' },
    { id:'pg3', name:'Stripe', mode:'Test', enabled:false, methods:'International Cards', fee:'2.9% + ₹3', key:'sk_test_••••••••Ttq' }
  ];

  const integrations = [
    { id:'ig1', group:'Payments', name:'Razorpay', status:'Enabled', purpose:'Collect payments, refunds, payouts' },
    { id:'ig2', group:'Payments', name:'Cashfree', status:'Enabled', purpose:'Secondary gateway + COD settlement' },
    { id:'ig3', group:'Payments', name:'Stripe', status:'Disabled', purpose:'International checkout' },
    { id:'ig4', group:'Logistics', name:'Delhivery', status:'Enabled', purpose:'Pickup, AWB, tracking webhooks' },
    { id:'ig5', group:'Logistics', name:'Blue Dart', status:'Enabled', purpose:'Express and priority shipments' },
    { id:'ig6', group:'Logistics', name:'Shiprocket', status:'Enabled', purpose:'Multi-courier aggregation' },
    { id:'ig7', group:'Messaging', name:'Firebase Cloud Messaging', status:'Enabled', purpose:'Mobile + web push notifications' },
    { id:'ig8', group:'Messaging', name:'MSG91', status:'Enabled', purpose:'Transactional SMS and OTP' },
    { id:'ig9', group:'Messaging', name:'SendGrid', status:'Enabled', purpose:'Transactional and campaign email' },
    { id:'ig10', group:'Messaging', name:'WhatsApp Business API', status:'Planned', purpose:'Order and booking updates' },
    { id:'ig11', group:'Services', name:'Partner App API', status:'Planned', purpose:'Professional allocation and job status' },
    { id:'ig12', group:'Analytics', name:'GA4 + Server Events', status:'Enabled', purpose:'Funnel and attribution' }
  ];

  const apiKeys = [
    { id:'ak1', name:'Storefront Web', key:'pk_live_••••••••••••a91f', scope:'read:catalog, write:cart', created:daysAgo(120), lastUsed:daysAgo(0), status:'Active' },
    { id:'ak2', name:'Mobile App (Android/iOS)', key:'pk_live_••••••••••••7b2c', scope:'read:catalog, write:orders', created:daysAgo(110), lastUsed:daysAgo(0), status:'Active' },
    { id:'ak3', name:'Partner App (Services)', key:'sk_live_••••••••••••33de', scope:'read:bookings, write:job-status', created:daysAgo(40), lastUsed:daysAgo(1), status:'Active' },
    { id:'ak4', name:'ERP Sync (legacy)', key:'sk_live_••••••••••••0c14', scope:'read:inventory', created:daysAgo(400), lastUsed:daysAgo(90), status:'Revoked' }
  ];

  const roles = [
    { id:'r1', name:'Super Admin', users:2, desc:'Unrestricted access including billing and roles.' },
    { id:'r2', name:'Admin', users:5, desc:'Everything except roles, API keys and billing.' },
    { id:'r3', name:'Catalog Manager', users:8, desc:'Products, categories, brands, variants, sizes.' },
    { id:'r4', name:'Inventory Manager', users:6, desc:'Stock, warehouses, transfers, reorder alerts.' },
    { id:'r5', name:'Order Manager', users:11, desc:'Orders, shipments, returns and refunds.' },
    { id:'r6', name:'Marketing Manager', users:4, desc:'Offers, coupons, campaigns, notifications.' },
    { id:'r7', name:'Customer Support', users:19, desc:'Read orders, raise tickets, issue goodwill credit.' },
    { id:'r8', name:'Service Manager', users:3, desc:'Service catalogue, bookings, professionals, areas.' },
    { id:'r9', name:'Finance', users:3, desc:'Payments, settlements, refunds, reports.' }
  ];

  const permissionModules = ['Products','Categories','Inventory','Orders','Customers','Offers & Coupons','Campaigns','Services','Bookings','Professionals','Shipping','Analytics','Settings'];
  // matrix[roleId][module] = [view, create, update, delete]
  const permissionMatrix = (() => {
    const m = {};
    roles.forEach(r => {
      m[r.id] = {};
      permissionModules.forEach(mod => {
        let p = [true, false, false, false];
        if (r.name === 'Super Admin') p = [true, true, true, true];
        else if (r.name === 'Admin') p = [true, true, true, mod !== 'Settings'];
        else if (r.name === 'Catalog Manager') p = [true, /Products|Categories/.test(mod), /Products|Categories|Inventory/.test(mod), mod === 'Products'];
        else if (r.name === 'Inventory Manager') p = [true, mod === 'Inventory', mod === 'Inventory', false];
        else if (r.name === 'Order Manager') p = [true, mod === 'Orders', /Orders|Shipping/.test(mod), false];
        else if (r.name === 'Marketing Manager') p = [true, /Offers|Campaigns/.test(mod), /Offers|Campaigns/.test(mod), /Offers|Campaigns/.test(mod)];
        else if (r.name === 'Customer Support') p = [true, false, mod === 'Orders', false];
        else if (r.name === 'Service Manager') p = [true, /Services|Bookings|Professionals/.test(mod), /Services|Bookings|Professionals/.test(mod), mod === 'Services'];
        else if (r.name === 'Finance') p = [true, false, mod === 'Orders', false];
        m[r.id][mod] = p;
      });
    });
    return m;
  })();

  const business = {
    name:'KeenPlaza Commerce Pvt Ltd', brand:'KeenPlaza', gstin:'27AABCB1234C1ZV', support:'help@keenplaza.example.in',
    phone:'+91 22 4000 1200', currency:'INR (₹)', timezone:'Asia/Kolkata (GMT+5:30)',
    address:'Level 8, Commerce House, Andheri East, Mumbai 400069', cities:['Mumbai','Delhi NCR','Bengaluru','Pune','Ahmedabad','Surat','Hyderabad','Kochi','Jaipur']
  };

  /* ---------- analytics series ---------- */
  const revenueTrend = [
    { d:'Aug 03', product:412000, service:68000 }, { d:'Aug 04', product:388000, service:74000 },
    { d:'Aug 05', product:461000, service:81000 }, { d:'Aug 06', product:502000, service:92000 },
    { d:'Aug 07', product:478000, service:88000 }, { d:'Aug 08', product:589000, service:104000 },
    { d:'Aug 09', product:634000, service:121000 }
  ];
  const ordersTrend = [
    { d:'Aug 03', orders:284, bookings:61 }, { d:'Aug 04', orders:262, bookings:66 },
    { d:'Aug 05', orders:318, bookings:72 }, { d:'Aug 06', orders:341, bookings:84 },
    { d:'Aug 07', orders:329, bookings:79 }, { d:'Aug 08', orders:402, bookings:95 },
    { d:'Aug 09', orders:437, bookings:112 }
  ];
  const categorySales = [
    { label:'Electronics', value:1420000, color:'#5B3DF5' }, { label:'Appliances', value:1180000, color:'#0FB5A6' },
    { label:'Fashion', value:860000, color:'#FF7A2F' }, { label:'Home & Kitchen', value:520000, color:'#3B82F6' },
    { label:'Beauty', value:310000, color:'#F472B6' }, { label:'Footwear', value:280000, color:'#F5A524' }
  ];
  const channelSales = [
    { label:'Mobile App', value:2410000, color:'#5B3DF5' }, { label:'Web', value:1620000, color:'#0FB5A6' },
    { label:'Mobile Web', value:410000, color:'#FF7A2F' }, { label:'Partner / API', value:130000, color:'#A0A0B3' }
  ];
  const funnel = [
    { label:'Sessions', value:184200 }, { label:'Product Views', value:96400 }, { label:'Add to Cart', value:28100 },
    { label:'Checkout Started', value:11200 }, { label:'Orders', value:6820 }
  ];
  const serviceStats = [
    { label:'AC Service & Repair', bookings:1842, revenue:1290000, cancel:'4.1%', util:'82%' },
    { label:'Salon at Home', bookings:1210, revenue:1090000, cancel:'6.8%', util:'74%' },
    { label:'Home Cleaning', bookings:940, revenue:1420000, cancel:'5.2%', util:'69%' },
    { label:'Electrician', bookings:1520, revenue:420000, cancel:'3.4%', util:'88%' },
    { label:'Appliance Repair', bookings:610, revenue:380000, cancel:'7.1%', util:'61%' },
    { label:'Pest Control', bookings:288, revenue:372000, cancel:'2.9%', util:'55%' }
  ];

  /* ---------- addresses / payment methods (customer side) ---------- */
  const addresses = [
    { id:'ad1', label:'Home', name:'Aarav Sharma', phone:'+91 98200 41122', default:true,
      line:'B-1204, Oberoi Splendor, JVLR', area:'Andheri East', city:'Mumbai', state:'Maharashtra', pin:'400060' },
    { id:'ad2', label:'Office', name:'Aarav Sharma', phone:'+91 98200 41122', default:false,
      line:'Level 8, Commerce House, Chakala', area:'Andheri East', city:'Mumbai', state:'Maharashtra', pin:'400069' },
    { id:'ad3', label:'Other', name:'Sharma Residence', phone:'+91 98920 11223', default:false,
      line:'12, Sunshine Bungalow, Carter Road', area:'Bandra West', city:'Mumbai', state:'Maharashtra', pin:'400050' }
  ];

  const savedPayments = [
    { id:'pm1', type:'UPI', label:'aarav@okhdfcbank', meta:'Default UPI', icon:'🟣' },
    { id:'pm2', type:'Credit Card', label:'HDFC •••• 4821', meta:'Expires 08/29', icon:'💳' },
    { id:'pm3', type:'Wallet', label:'KeenPlaza Wallet', meta:'Balance ₹1,250', icon:'👛' }
  ];

  const supportTickets = [
    { id:'TK-8841', subject:'Delayed delivery for BZ100240', user:'u1', status:'Open', priority:'High', updated:daysAgo(0) },
    { id:'TK-8837', subject:'Reschedule AC installation slot', user:'u3', status:'Open', priority:'Medium', updated:daysAgo(1) },
    { id:'TK-8829', subject:'Refund not received', user:'u5', status:'Resolved', priority:'High', updated:daysAgo(4) }
  ];

  /* ---------- cross-sell: product category → recommended service package ---------- */
  const crossSell = {
    'c-ac':          { pkg:'pk-ac-install',      pitch:'Add AC Installation' },
    'c-tv':          { pkg:'pk-appl-install',    pitch:'Add TV Wall Mount & Demo' },
    'c-washing':     { pkg:'pk-appl-install',    pitch:'Add Professional Installation' },
    'c-purifier':    { pkg:'pk-appl-install',    pitch:'Book Installation' },
    'c-furniture':   { pkg:'pk-carp-assembly',   pitch:'Book Assembly Service' },
    'c-appliances':  { pkg:'pk-elec-fan',        pitch:'Add Fan Installation' },
    'c-cook':        { pkg:'pk-clean-1bhk',      pitch:'Add Kitchen Deep Clean' },
    'c-home':        { pkg:'pk-clean-1bhk',      pitch:'Add Home Deep Clean' }
  };

  /* ---------- multi-marketplace category mapping & listings ---------- */
  const marketplaces = [
    { id:'amazon', name:'Amazon', logo:'🅰️' },
    { id:'meesho', name:'Meesho', logo:'🅼' },
    { id:'shopify', name:'Shopify', logo:'🛍️' },
    { id:'myntra', name:'Myntra', logo:'Ⓜ️' }
  ];
  const marketplaceCategories = {
    amazon:  [{ id:'amz-ac', path:'Home & Kitchen > Large Appliances > Air Conditioners' },
              { id:'amz-shoes', path:'Clothing & Accessories > Men > Shoes' },
              { id:'amz-mobiles', path:'Electronics > Mobiles & Accessories > Smartphones' },
              { id:'amz-cook', path:'Home & Kitchen > Kitchen & Dining > Cookware' }],
    meesho:  [{ id:'msh-ac', path:'Home Appliances > Air Conditioner' },
              { id:'msh-dress', path:"Women's Fashion > Western Wear > Dresses" },
              { id:'msh-cook', path:'Kitchen & Home > Cookware & Utensils' }],
    shopify: [{ id:'shp-ac', path:'Appliances / Air Conditioners' },
              { id:'shp-shoes', path:"Footwear / Men's Shoes" },
              { id:'shp-dress', path:"Apparel / Women's Dresses" },
              { id:'shp-mobiles', path:'Electronics / Smartphones' },
              { id:'shp-cook', path:'Home & Kitchen / Cookware' },
              { id:'shp-watch', path:'Accessories / Watches' }],
    myntra:  [{ id:'myn-shoes', path:'Men > Footwear > Casual Shoes' },
              { id:'myn-dress', path:'Women > Western Wear > Dresses' },
              { id:'myn-watch', path:'Accessories > Watches' }]
  };
  // keenplaza category id → { marketplace: marketplaceCategoryId | null }. null/absent = unmapped.
  const categoryMappings = {
    'c-ac':          { amazon:'amz-ac', meesho:'msh-ac', shopify:'shp-ac', myntra:null },
    'c-men-shoes':   { amazon:'amz-shoes', meesho:null, shopify:'shp-shoes', myntra:'myn-shoes' },
    'c-wom-dress':   { amazon:null, meesho:'msh-dress', shopify:'shp-dress', myntra:'myn-dress' },
    'c-mobiles':     { amazon:'amz-mobiles', meesho:null, shopify:'shp-mobiles', myntra:null },
    'c-cook':        { amazon:'amz-cook', meesho:'msh-cook', shopify:'shp-cook', myntra:null },
    'c-accessories': { amazon:null, meesho:null, shopify:'shp-watch', myntra:'myn-watch' }
  };
  // per-marketplace mandatory attributes, keyed by marketplace category id (drives CSV template + validation demo)
  const marketplaceAttrSchema = {
    'amz-ac': ['bullet_point_1', 'bullet_point_2', 'bullet_point_3', 'energy_rating', 'capacity_tons'],
    'msh-ac': ['gst_rate_slab', 'hsn_code'],
    'shp-ac': ['product_type'],
    'amz-shoes': ['bullet_point_1', 'size_chart_url', 'material'],
    'myn-shoes': ['article_type', 'size_chart_id'],
    'msh-dress': ['gst_rate_slab', 'hsn_code', 'fabric'],
    'myn-dress': ['article_type', 'size_chart_id', 'occasion']
  };
  // product id → per-marketplace listing state
  const productMarketplaceListings = {
    'p1': { amazon:{ status:'listed', extId:'B0AMZ001' }, shopify:{ status:'listed', extId:'shp_9911' } },
    'p3': { amazon:{ status:'pending' }, meesho:{ status:'rejected', error:'Missing gst_rate_slab' } },
    'p6': { amazon:{ status:'listed', extId:'B0AMZ118' }, meesho:{ status:'listed', extId:'msh_2281' }, shopify:{ status:'draft' } },
    'p8': { shopify:{ status:'listed', extId:'shp_4471' }, myntra:{ status:'pending' } },
    'p11':{ myntra:{ status:'listed', extId:'myn_7734' }, amazon:{ status:'rejected', error:'Category unmapped for this product\'s category' } }
  };
  const importJobs = [
    { id:'imp1', file:'diwali-catalog-batch3.csv', marketplaces:['amazon','shopify'], status:'completed', total:240, success:228, failed:12, uploadedBy:'Priya (Catalog Manager)', when:'2026-09-06T11:20:00+05:30' },
    { id:'imp2', file:'myntra-footwear-refresh.csv', marketplaces:['myntra'], status:'completed', total:86, success:86, failed:0, uploadedBy:'Priya (Catalog Manager)', when:'2026-09-05T16:05:00+05:30' },
    { id:'imp3', file:'meesho-kitchen-launch.csv', marketplaces:['meesho'], status:'processing', total:150, success:64, failed:3, uploadedBy:'Rahul (Ops)', when:'2026-09-08T09:40:00+05:30' }
  ];
  const importErrors = [
    { importId:'imp1', row:14, sku:'LG-AC15-BLK-1.5Ton', field:'bullet_point_3', message:'Amazon: required attribute missing' },
    { importId:'imp1', row:52, sku:'NK-SHOE-42-BLU', field:'category', message:'Shopify: row category not mapped to a Shopify collection' },
    { importId:'imp3', row:9, sku:'PRE-KAD-3L', field:'gst_rate_slab', message:'Meesho: required attribute missing' }
  ];

  /* ---------- super admin portal (platform ops / on-call) ---------- */
  const platformTenants = [
    { id:'t-keenplaza', name:'KeenPlaza Flagship', slug:'keenplaza', plan:'Enterprise', status:'active', mrr:842000, createdAt:'2025-11-02T00:00:00+05:30', errorRate:0.4, p95:210, health:'healthy' },
    { id:'t-urbanfix', name:'UrbanFix Services', slug:'urbanfix', plan:'Growth', status:'active', mrr:186000, createdAt:'2026-02-14T00:00:00+05:30', errorRate:2.1, p95:340, health:'degraded' },
    { id:'t-rentkart', name:'RentKart', slug:'rentkart', plan:'Growth', status:'active', mrr:94000, createdAt:'2026-05-30T00:00:00+05:30', errorRate:0.2, p95:180, health:'healthy' },
    { id:'t-quickmart', name:'QuickMart Local', slug:'quickmart', plan:'Starter', status:'onboarding', mrr:0, createdAt:'2026-09-06T00:00:00+05:30', errorRate:0, p95:0, health:'pending' },
    { id:'t-fixmyhome', name:'FixMyHome', slug:'fixmyhome', plan:'Starter', status:'suspended', mrr:12000, createdAt:'2026-01-10T00:00:00+05:30', errorRate:9.8, p95:1200, health:'critical' }
  ];
  const platformFeatureFlags = [
    { id:'ff1', tenantId:null, key:'rental_vertical', enabled:false, rolloutPct:0, desc:'Enables the rental cart line kind + booking date-range slots' },
    { id:'ff2', tenantId:null, key:'marketplace_listings', enabled:true, rolloutPct:100, desc:'Amazon/Meesho/Shopify/Myntra category mapping + bulk listing' },
    { id:'ff3', tenantId:'t-keenplaza', key:'whatsapp_notifications', enabled:true, rolloutPct:100, desc:'WhatsApp channel in the notification trigger matrix' },
    { id:'ff4', tenantId:'t-urbanfix', key:'allocation_v2_scoring', enabled:true, rolloutPct:50, desc:'New professional-scoring weights (rating 40/distance 25/load 20/accept 15)' },
    { id:'ff5', tenantId:'t-rentkart', key:'rental_vertical', enabled:true, rolloutPct:100, desc:'Overrides the platform default — RentKart is the rental vertical design partner' }
  ];
  const platformAuditLog = [
    { id:'al1', actor:'priya@keenplaza.internal', tenantId:'t-rentkart', action:'feature_flag.enabled', target:'rental_vertical', oldValue:'false', newValue:'true', when:'2026-09-07T10:15:00+05:30' },
    { id:'al2', actor:'rahul@keenplaza.internal', tenantId:'t-fixmyhome', action:'tenant.suspended', target:'t-fixmyhome', oldValue:'active', newValue:'suspended', when:'2026-09-06T18:40:00+05:30', note:'Sustained 9.8% error rate, payment webhook signature failures' },
    { id:'al3', actor:'priya@keenplaza.internal', tenantId:'t-quickmart', action:'tenant.onboarded', target:'t-quickmart', oldValue:null, newValue:'onboarding', when:'2026-09-06T09:00:00+05:30' },
    { id:'al4', actor:'arjun@keenplaza.internal', tenantId:'t-urbanfix', action:'feature_flag.rollout_changed', target:'allocation_v2_scoring', oldValue:'25%', newValue:'50%', when:'2026-09-05T14:22:00+05:30' },
    { id:'al5', actor:'priya@keenplaza.internal', tenantId:'t-keenplaza', action:'webhook.replayed', target:'payment_evt_88213', oldValue:null, newValue:null, when:'2026-09-04T11:05:00+05:30', note:'Razorpay webhook lost to a deploy race — replayed from provider event log' }
  ];
  // canned troubleshoot lookups keyed by what an on-call engineer might paste in
  const troubleshootLookups = {
    'req_8f21a93c': { tenantId:'t-urbanfix', traceId:'trc_77c1', correlationId:'corr_9e40', summary:'Checkout saga stuck in COMPENSATING',
      timeline:[
        ['order-service', 'Saga started, reservation held', '10:02:01'],
        ['payment-service', 'CreateIntent → provider timeout after 8s', '10:02:09'],
        ['order-service', 'Saga compensation triggered: release reservation, release slot hold', '10:02:09'],
        ['inventory-service', 'Reservation released', '10:02:10'],
        ['booking-service', 'Slot hold released', '10:02:10'],
        ['order-service', 'Order → FAILED, customer notified', '10:02:11']
      ],
      suggestion:'Matches "Checkout stuck mid-saga" in local-debugging.md — check payment provider status page; this is a provider timeout, not a KeenPlaza defect.' },
    'BZ100241': { tenantId:'t-keenplaza', traceId:'trc_51a0', correlationId:'corr_2b71', summary:'Order stuck OUT_FOR_DELIVERY, courier webhook never arrived',
      timeline:[
        ['logistics-service', 'Shipment created, AWB assigned', '2026-09-03 09:10'],
        ['delhivery', 'Courier webhook: picked up', '2026-09-03 11:00'],
        ['logistics-service', 'No further webhook received in 48h', '2026-09-05 09:10']
      ],
      suggestion:'Matches "Event never consumed" — check Delhivery\'s webhook delivery log for this AWB; poll their tracking API directly as a fallback.' }
  };

  /* ---------- export ---------- */
  global.MOCK = {
    categories, brands, sizeGroups, attributes, products, reviews,
    serviceCategories, servicePackages, professionals, serviceAreas, timeSlots, bookings, bookingTimeline,
    customers, segments, orders, orderStatuses, orderTimeline, statusTone, couriers,
    coupons, offers, campaigns, notificationTriggers, customerNotifications,
    shippingProviders, shipments, warehouses, stockHistory,
    paymentGateways, integrations, apiKeys, roles, permissionModules, permissionMatrix, business,
    revenueTrend, ordersTrend, categorySales, channelSales, funnel, serviceStats,
    addresses, savedPayments, supportTickets, crossSell, COLORS,
    marketplaces, marketplaceCategories, categoryMappings, marketplaceAttrSchema,
    productMarketplaceListings, importJobs, importErrors,
    platformTenants, platformFeatureFlags, platformAuditLog, troubleshootLookups,
    // flat category list helper
    flatCategories: (function flat(list, out = [], depth = 0) {
      list.forEach(c => { out.push(Object.assign({ depth }, c)); if (c.children) flat(c.children, out, depth + 1); });
      return out;
    })(categories)
  };
})(window);
