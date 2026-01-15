  
    const N8N_URL = "https://maresdev.app.n8n.cloud/webhook/chat-mantenimiento"; 

    async function enviarMensaje() {
        const input = document.getElementById('userInput');
        const text = input.value;
        if (!text) return;


        addMessage(text, 'user');
        input.value = '';
        input.focus();

   
        const loadingId = addMessage("Analizando datos...", 'bot', true);

        try {
            const response = await fetch(N8N_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            

            removeMessage(loadingId);

     
            let reporte = {};
        
            let rawJson = typeof data === 'string' ? data : (data.output || JSON.stringify(data));
            
            rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                reporte = JSON.parse(rawJson);
            } catch (e) {
              
                reporte = { mensaje: rawJson };
            }

 
            if (reporte.accion === "GUARDAR_UNIDAD" || reporte.accion === "AGENDAR_CITA") {
               
                actualizarSemaforo({ color: 'VERDE', riesgo_total: 0, status: 'REGISTRO OK' });
                addMessage("✅ " + reporte.mensaje, 'bot');
            
            } else if (reporte.riesgo_total !== undefined) {
            
                actualizarSemaforo(reporte);
                addMessage("🔧 " + reporte.mensaje, 'bot');
            
            } else {
          
                addMessage(reporte.mensaje || "Respuesta recibida.", 'bot');
            }

        } catch (error) {
            console.error(error);
            document.getElementById(loadingId).innerText = "❌ Error de conexión con el servidor.";
        }
    }

    function actualizarSemaforo(data) {
       
        document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
        
        const color = data.color ? data.color.toLowerCase() : 'verde';
        const puntos = data.riesgo_total !== undefined ? data.riesgo_total : 0;
        

        if(color === 'rojo') document.getElementById('light-red').classList.add('active');
        else if(color === 'amarillo') document.getElementById('light-yellow').classList.add('active');
        else document.getElementById('light-green').classList.add('active');

        document.getElementById('scoreDisplay').innerText = puntos + " pts";
  
        let status = "OPERATIVO";
        if(data.status) status = data.status;
        else if(color === 'rojo') status = "RIESGO CRÍTICO";
        else if(color === 'amarillo') status = "PRECAUCIÓN";
        
        document.getElementById('statusText').innerText = status;
        document.getElementById('statusText').style.color = (color === 'rojo') ? '#d9534f' : '#555';
    }

    function addMessage(text, sender, isLoading = false) {
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        div.innerHTML = text; 
        if(isLoading) div.id = "loading-" + Date.now();
        
        const history = document.getElementById('chatHistory');
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
        return div.id;
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }

    function handleEnter(e) {
        if (e.key === 'Enter') enviarMensaje();
    }