/* The form prepares a real email. It never claims a message was sent. */
(() => {
  "use strict";
  const form=document.getElementById("collaboration-form");
  if(!form)return;
  const preview=document.getElementById("proposal-preview");
  const summary=document.getElementById("proposal-summary");
  const status=document.getElementById("proposal-status");
  const message=form.elements.message;
  message.addEventListener("input",()=>{document.getElementById("message-count").textContent=String(message.value.length);});
  for(const input of form.querySelectorAll("[required]"))input.addEventListener("input",()=>input.setCustomValidity(""));
  form.addEventListener("submit",event=>{
    event.preventDefault();
    for(const input of form.querySelectorAll("[required]"))input.setCustomValidity(input.value.trim()?"":"Completa este campo.");
    if(!form.reportValidity())return;
    const values=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,String(value).trim()]));
    const body=["¡Hola, equipo de Sushi Bites!","Me gustaría proponer una colaboración.","",`Nombre: ${values.name}`,`Correo: ${values.email}`,`WhatsApp / Teléfono: ${values.phone||"No indicado"}`,`Ciudad y país: ${values.location}`,`Plataformas: ${values.platforms||"No indicadas"}`,"","Links de mis perfiles:",values.links||"No indicados","","Mi propuesta:",values.message].join("\n");
    summary.value=body;
    const subject=`Propuesta de colaboración — ${values.name}`;
    document.getElementById("proposal-email").href=`mailto:collabs@sushibitesbolivia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    preview.hidden=false;
    status.textContent="La propuesta está preparada. Aún no se ha enviado.";
    preview.focus({preventScroll:true});
    preview.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"});
  });
  form.addEventListener("input",()=>{if(!preview.hidden){preview.hidden=true;summary.value="";document.getElementById("proposal-email").href="mailto:collabs@sushibitesbolivia.com";}});
  document.getElementById("proposal-copy").addEventListener("click",async()=>{
    try{
      if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(summary.value);
      status.textContent="Propuesta copiada. Pégala en un correo para collabs@sushibitesbolivia.com.";
    }catch{
      summary.focus();summary.select();
      status.textContent="Seleccionamos tu propuesta. Cópiala y pégala en tu correo.";
    }
  });
})();
