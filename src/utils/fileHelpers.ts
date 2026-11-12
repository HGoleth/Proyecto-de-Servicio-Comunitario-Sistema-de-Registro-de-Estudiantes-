import { Area } from "react-easy-crop";

/**
 * Convierte un archivo File en una cadena base64.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Recorta una imagen según el área especificada y retorna un File y preview URL.
 */
export async function getCroppedImg(
  imageSrc: string,
  crop: Area
): Promise<{ file: File; preview: string }> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener contexto del canvas");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob(resolve as BlobCallback, "image/jpeg")!
  );

  const file = new File([blob], `cropped_${Date.now()}.jpeg`, {
    type: "image/jpeg",
  });
  const preview = URL.createObjectURL(file);

  return { file, preview };
}
