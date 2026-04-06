export interface ImageQualityResult {
  isGood: boolean;
  score: number; // 0-100
  feedback: string[];
  blurScore: number;
  brightnessScore: number;
  sizeScore: number;
}

export async function checkImageQuality(imageDataUrl: string): Promise<ImageQualityResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ isGood: false, score: 0, feedback: ["Canvas not supported"], blurScore: 0, brightnessScore: 0, sizeScore: 0 });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 1. Brightness Check (Average Luminance)
      let totalLuminance = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard luminance formula
        totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
      }
      const avgLuminance = totalLuminance / (data.length / 4);
      const brightnessScore = Math.max(0, 100 - Math.abs(avgLuminance - 128) * 0.8);

      // 2. Blur Detection (Simple Edge Detection Variance)
      // We'll use a simplified Laplacian variance check
      let variance = 0;
      let mean = 0;
      const grayData = new Float32Array(data.length / 4);
      for (let i = 0; i < data.length; i += 4) {
        grayData[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
      }

      // Compute Laplacian (3x3 kernel)
      const laplacian = new Float32Array(grayData.length);
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = y * canvas.width + x;
          const val = 
            -1 * grayData[idx - canvas.width - 1] + -1 * grayData[idx - canvas.width] + -1 * grayData[idx - canvas.width + 1] +
            -1 * grayData[idx - 1] + 8 * grayData[idx] + -1 * grayData[idx + 1] +
            -1 * grayData[idx + canvas.width - 1] + -1 * grayData[idx + canvas.width] + -1 * grayData[idx + canvas.width + 1];
          laplacian[idx] = val;
          mean += val;
        }
      }
      mean /= laplacian.length;
      for (let i = 0; i < laplacian.length; i++) {
        variance += Math.pow(laplacian[i] - mean, 2);
      }
      variance /= laplacian.length;
      const blurScore = Math.min(100, variance / 2); // Threshold 200 = 100%

      // 3. Size Check
      const sizeScore = (canvas.width >= 300 && canvas.height >= 300) ? 100 : 0;

      const feedback: string[] = [];
      if (blurScore < 40) feedback.push("Image appears blurry. Please retake in better lighting.");
      if (avgLuminance < 40) feedback.push("Image is too dark.");
      if (avgLuminance > 220) feedback.push("Image is overexposed.");
      if (sizeScore === 0) feedback.push("Image resolution is too low.");

      const overallScore = (blurScore * 0.4 + brightnessScore * 0.4 + sizeScore * 0.2);
      const isGood = overallScore > 60 && sizeScore === 100;

      resolve({
        isGood,
        score: Math.round(overallScore),
        feedback,
        blurScore: Math.round(blurScore),
        brightnessScore: Math.round(brightnessScore),
        sizeScore: Math.round(sizeScore)
      });
    };
    img.src = imageDataUrl;
  });
}
