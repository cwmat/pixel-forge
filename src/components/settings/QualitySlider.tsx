import { useImageStore } from "@/stores/image-store";
import { FORMAT_SUPPORTS_QUALITY } from "@/constants/formats";
import { Slider } from "@/components/shared/Slider";

export function QualitySlider() {
  const outputFormat = useImageStore((s) => s.settings.outputFormat);
  const quality = useImageStore((s) => s.settings.quality);
  const updateSettings = useImageStore((s) => s.updateSettings);

  if (!FORMAT_SUPPORTS_QUALITY.includes(outputFormat)) return null;

  return (
    <Slider
      label="Quality"
      value={quality}
      min={1}
      max={100}
      unit="%"
      onChange={(value) => updateSettings({ quality: value })}
    />
  );
}
