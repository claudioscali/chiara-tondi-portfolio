
from pathlib import Path
from PIL import Image, ImageOps

ORIGINALE = Path("images")
DESTINAZIONE = Path("images_webp")
QUALITA = 82

# Adatta questi nomi al nome effettivo del logo.
LOGHI_DA_ESCLUDERE = {
    "logo.webp",
    "logo.jpeg",
}


def converti_immagini():
    if not ORIGINALE.is_dir():
        print(f"Cartella non trovata: {ORIGINALE}")
        return

    estensioni = {".webp", ".jpeg"}
    immagini = sorted(
        p for p in ORIGINALE.rglob("*")
        if p.is_file() and p.suffix.lower() in estensioni
    )

    totale_originale = 0
    totale_webp = 0
    convertite = 0

    for sorgente in immagini:
        if sorgente.name.lower() in LOGHI_DA_ESCLUDERE:
            print(f"Logo escluso: {sorgente}")
            continue

        relativo = sorgente.relative_to(ORIGINALE)
        destinazione = (
            DESTINAZIONE / relativo
        ).with_suffix(".webp")

        if destinazione.exists():
            print(f"Già esistente, salto: {destinazione}")
            continue

        try:
            with Image.open(sorgente) as img:
                img = ImageOps.exif_transpose(img)
                img.load()

                # Le fotografie JPG sono normalmente RGB.
                img = img.convert("RGB")

                destinazione.parent.mkdir(
                    parents=True, exist_ok=True
                )

                img.save(
                    destinazione,
                    "WEBP",
                    quality=QUALITA,
                    method=6,
                )

            peso_originale = sorgente.stat().st_size
            peso_webp = destinazione.stat().st_size

            totale_originale += peso_originale
            totale_webp += peso_webp
            convertite += 1

            risparmio = (
                1 - peso_webp / peso_originale
            ) * 100 if peso_originale else 0

            print(
                f"{relativo}: "
                f"{peso_originale / 1024:.1f} KB -> "
                f"{peso_webp / 1024:.1f} KB "
                f"({risparmio:.1f}% risparmiato)"
            )

        except Exception as errore:
            print(f"Errore con {sorgente}: {errore}")

    print("\n--- RIEPILOGO ---")
    print(f"Immagini convertite: {convertite}")
    print(f"Peso originale: {totale_originale / 1024:.1f} KB")
    print(f"Peso WebP: {totale_webp / 1024:.1f} KB")

    if totale_originale:
        risparmio = (
            1 - totale_webp / totale_originale
        ) * 100
        print(f"Risparmio complessivo: {risparmio:.1f}%")


if __name__ == "__main__":
    converti_immagini()