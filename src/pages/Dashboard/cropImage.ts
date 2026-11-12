// Esta función recibe una imagen y un recorte (pixelCrop),
// y devuelve una promesa con la imagen recortada en formato base64.
export default function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  
  // Creamos un objeto imagen y le colocamos la ruta/base64 original
  const image = new Image();
  image.src = imageSrc;

  // Creamos un canvas temporal donde vamos a dibujar el recorte
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Ajustamos el tamaño del canvas al tamaño exacto del recorte
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Regresamos una promesa porque debemos esperar a que la imagen cargue
  return new Promise((resolve) => {
    image.onload = () => {
      // Cuando la imagen carga, dibujamos solo la parte que queremos recortar
      ctx.drawImage(
        image,
        pixelCrop.x,        // Desde dónde empieza el recorte en X
        pixelCrop.y,        // Desde dónde empieza el recorte en Y
        pixelCrop.width,    // Ancho del recorte
        pixelCrop.height,   // Alto del recorte
        0,                  // Posición X dentro del canvas
        0,                  // Posición Y dentro del canvas
        pixelCrop.width,    // Tamaño final del recorte en el canvas
        pixelCrop.height
      );

      // Convertimos el canvas en una imagen base64 tipo JPG
      resolve(canvas.toDataURL("image/jpeg"));
    };
  });
}
