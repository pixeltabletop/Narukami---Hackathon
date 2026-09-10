# Audio de prueba para el dictado

Dos frases en español, sintetizadas con la voz Sabina de Windows, en el mismo formato que el
navegador envía al servidor: WAV PCM de 16 bits, 16 kHz, un canal. Están aquí para que
`npm run voice:check` se pueda ejecutar sin grabar nada:

```powershell
$env:CHEN_ENABLE_QVAC="1"
npm run voice:check -- ./audio/consulta.wav ./audio/ahorro.wav
```

| Archivo | Lo que dice |
| --- | --- |
| `consulta.wav` | «En qué rubro se me ha ido más en los últimos tres meses» |
| `ahorro.wav` | «Cuánto llevo gastado en Restaurantes» |

Son voz sintética a propósito. Usar una grabación de una persona real metería un dato biométrico
en el repositorio, y este proyecto no lleva datos de nadie.
