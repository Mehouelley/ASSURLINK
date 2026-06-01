import { useState } from 'react';

type Props = {
  multiple?: boolean;
  accept?: string;
  onUploaded: (url: string) => void;
};

export function FileUploader({ multiple = false, accept = '*/*', onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  async function uploadFile(file: File) {
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary non configuré (VITE_CLOUDINARY_...)');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        setProgress(0);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.secure_url) onUploaded(res.secure_url);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = () => { setUploading(false); setProgress(0); reject(new Error('Network error')); };
      setUploading(true);
      xhr.send(fd);
    });
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      try { await uploadFile(files[i]); } catch (err) { console.error(err); alert('Échec upload'); }
    }
    // clear input
    (e.target as HTMLInputElement).value = '';
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="file" accept={accept} multiple={multiple} onChange={handleFiles} className="hidden" />
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100" aria-label="Choisir un fichier" title="Choisir un fichier">Choisir un fichier</div>
        {uploading && <div className="text-xs text-gray-500">Téléversement {progress}%</div>}
      </label>
      {uploading && (
        <svg className="w-full h-2 overflow-hidden rounded-xl bg-gray-100" viewBox="0 0 100 4" role="img" aria-label={`Progression upload ${progress}%`}>
          <rect x="0" y="0" width="100" height="4" rx="2" fill="#e5e7eb" />
          <rect x="0" y="0" width={Math.max(progress, 0)} height="4" rx="2" fill="#2563eb" />
        </svg>
      )}
    </div>
  );
}

export default FileUploader;
