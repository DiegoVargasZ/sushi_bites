/* MapLibre is bundled locally. OpenFreeMap supports public browser maps without API keys. */
"use strict";
const deliveryLocation=(()=>{
  const element=document.getElementById("delivery-map");
  const status=document.getElementById("delivery-map-status");
  const locateButton=document.getElementById("locate-delivery");
  const clearButton=document.getElementById("clear-delivery-point");
  const pointLink=document.getElementById("delivery-point-link");
  const networkNotice=document.getElementById("delivery-map-network");
  const retryButton=document.getElementById("retry-delivery-map");
  const mapStyle="https://tiles.openfreemap.org/styles/liberty";
  const areas={central:[-17.3895,-66.1568],hupermall:[-17.378,-66.154],quillacollo:[-17.392,-66.279]};
  let map=null,marker=null,point=null,enabled=false,area="central",request=0,mapReady=false;
  let libraryLoading=false,libraryReady=false,libraryFailed=false;
  function loadLibrary(){
    const stylesheet=document.createElement("link");
    stylesheet.rel="stylesheet";stylesheet.href="vendor/maplibre/maplibre-gl.css";
    const script=document.createElement("script");
    script.src="vendor/maplibre/maplibre-gl.js";script.async=true;
    const loaded=node=>new Promise((resolve,reject)=>{
      node.onload=resolve;node.onerror=()=>reject(new Error("Map library unavailable"));
      document.head.append(node);
    });
    return Promise.all([loaded(stylesheet),loaded(script)]).catch(error=>{stylesheet.remove();script.remove();throw error;});
  }
  const normalize=p=>p&&typeof p.lat==="number"&&typeof p.lng==="number"&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=85.0511&&Math.abs(p.lng)<=180?{lat:Number(p.lat.toFixed(6)),lng:Number(p.lng.toFixed(6))}:null;
  const url=p=>`https://www.google.com/maps?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  function message(text,error=false){status.textContent=text;status.classList.toggle("is-error",error);element.classList.toggle("needs-point",error);}
  function updateMarker(){
    if(!map)return;
    if(!point){if(marker){marker.remove();marker=null;}return;}
    if(marker){marker.setLngLat([point.lng,point.lat]);return;}
    const pin=document.createElement("div");pin.className="delivery-marker";pin.innerHTML='<span class="delivery-pin-dot"></span>';
    pin.tabIndex=0;pin.setAttribute("role","button");pin.setAttribute("aria-label","Ubicación de entrega. Arrastra para ajustar.");
    marker=new maplibregl.Marker({element:pin,draggable:true,anchor:"bottom"}).setLngLat([point.lng,point.lat]).addTo(map);
    marker.on("dragend",()=>choose(marker.getLngLat(),"Ubicación ajustada. El punto se incluirá en tu pedido."));
  }
  function choose(value,text="Ubicación seleccionada. Puedes mover el pin para ajustar.",emit=true){
    if(emit){request++;locateButton.disabled=false;locateButton.textContent="⌖ Usar mi ubicación";}
    point=normalize(value);
    updateMarker();
    pointLink.hidden=!point;clearButton.hidden=!point;
    if(point){pointLink.href=url(point);message(text);}else{pointLink.removeAttribute("href");message("Selecciona en el mapa el lugar donde recibirás tu pedido.");}
    if(emit)document.dispatchEvent(new CustomEvent("deliverylocationchange",{detail:point?{...point}:null}));
  }
  function initialize(){
    if(!enabled||!element.clientWidth||!element.clientHeight)return;
    if(!libraryReady){
      if(libraryLoading||libraryFailed)return;
      libraryLoading=true;element.dataset.mapState="loading";
      networkNotice.hidden=true;retryButton.hidden=true;
      loadLibrary().then(()=>{libraryReady=true;libraryLoading=false;initialize();}).catch(()=>{
        libraryFailed=true;libraryLoading=false;element.dataset.mapState="error";networkNotice.hidden=false;retryButton.hidden=false;
        message("No se pudo cargar el mapa. Puedes usar tu ubicación actual o volver a cargarlo.",true);
      });
      return;
    }
    if(!map){
      element.dataset.mapState="loading";
      try{
        map=new maplibregl.Map({container:element,style:mapStyle,center:point?[point.lng,point.lat]:[areas[area][1],areas[area][0]],zoom:point?17:13,minZoom:3,maxZoom:19,scrollZoom:false,dragRotate:false,pitchWithRotate:false,fadeDuration:0,attributionControl:{compact:false},locale:{"NavigationControl.ZoomIn":"Acercar","NavigationControl.ZoomOut":"Alejar"}});
      }catch{
        element.dataset.mapState="error";networkNotice.hidden=false;retryButton.hidden=false;message("No se pudo iniciar el mapa. Puedes usar tu ubicación actual o volver a cargarlo.",true);return;
      }
      map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-left");
      map.touchZoomRotate.disableRotation();map.touchPitch.disable();
      map.getCanvas().setAttribute("aria-label","Mapa de calles para marcar tu ubicación de entrega");
      map.on("load",()=>{if(map.queryRenderedFeatures().length){mapReady=true;element.dataset.mapState="ready";networkNotice.hidden=true;retryButton.hidden=true;}});
      map.on("error",()=>{networkNotice.hidden=false;retryButton.hidden=false;if(!mapReady)element.dataset.mapState="error";});
      map.on("idle",()=>{if(map.isStyleLoaded()&&map.queryRenderedFeatures().length){mapReady=true;element.dataset.mapState="ready";networkNotice.hidden=true;retryButton.hidden=true;}});
      map.on("click",event=>{if(enabled&&mapReady)choose(event.lngLat);});
      element.addEventListener("keydown",event=>{if(enabled&&mapReady&&event.key==="Enter"&&(event.target===element||event.target===map.getCanvas())){event.preventDefault();event.stopPropagation();choose(map.getCenter());}});
      updateMarker();
    }
    map.resize();
  }
  function setEnabled(value,branch="central"){
    const previous=enabled,previousArea=area;
    enabled=Boolean(value);area=Object.hasOwn(areas,branch)?branch:"central";
    if(!enabled){if(previous){request++;locateButton.disabled=false;locateButton.textContent="⌖ Usar mi ubicación";}return;}
    initialize();
    if(map&&!point&&previousArea!==area)map.jumpTo({center:[areas[area][1],areas[area][0]],zoom:13});
  }
  locateButton.addEventListener("click",()=>{
    if(!enabled)return;
    if(!navigator.geolocation){message("Tu navegador no permite obtener la ubicación. Toca el mapa para seleccionarla.",true);return;}
    const current=++request;
    locateButton.disabled=true;locateButton.textContent="Buscando…";message("Buscando tu ubicación. Autoriza el acceso en tu navegador.");
    navigator.geolocation.getCurrentPosition(position=>{
      if(current!==request||!enabled)return;
      locateButton.disabled=false;locateButton.textContent="⌖ Usar mi ubicación";
      const location=normalize({lat:position.coords.latitude,lng:position.coords.longitude});
      if(!location){message("No pudimos obtener un punto válido. Toca el mapa para seleccionarlo.",true);return;}
      initialize();choose(location,"Ubicación actual seleccionada. Revisa el pin y ajústalo si hace falta.");
      if(map)map.jumpTo({center:[point.lng,point.lat],zoom:17});
    },error=>{
      if(current!==request||!enabled)return;
      locateButton.disabled=false;locateButton.textContent="⌖ Usar mi ubicación";
      message(error.code===1?"Permiso de ubicación denegado. Toca el mapa para elegir el punto.":"No pudimos obtener tu ubicación. Toca el mapa para elegir el punto.",true);
    },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });
  clearButton.addEventListener("click",()=>{request++;locateButton.disabled=false;locateButton.textContent="⌖ Usar mi ubicación";choose(null);});
  retryButton.addEventListener("click",()=>{
    libraryFailed=false;
    networkNotice.hidden=true;retryButton.hidden=true;element.dataset.mapState="loading";mapReady=false;
    if(map)map.setStyle(mapStyle);else initialize();
  });
  if("ResizeObserver" in window)new ResizeObserver(()=>initialize()).observe(element);
  else window.addEventListener("resize",initialize);
  return {
    setEnabled,
    restore:value=>choose(value,"Ubicación recuperada. Revisa el pin antes de enviar.",false),
    getPoint:()=>point?{...point}:null,
    getUrl:()=>point?url(point):null,
    validate:()=>{
      if(point)return true;
      initialize();message("Marca tu ubicación en el mapa o usa tu ubicación actual antes de pedir.",true);
      element.tabIndex=0;element.focus({preventScroll:true});element.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});return false;
    }
  };
})();
