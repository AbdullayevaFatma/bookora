"use client";

import { Image, ImageKitProvider, Video, upload } from "@imagekit/next";

import config from "@/lib/config";
import { useRef, useState } from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const {
  env: {
    imagekit: { urlEndpoint },
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();

    const { signature, expire, token, publicKey } = data;

    return {
      token,
      expire,
      signature,
      publicKey,
    };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<{ filePath: string | null }>({
    filePath: value ?? null,
  });

  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300"
        : "bg-light-600 border-gray-100 border",
    placeholder: variant === "dark" ? "text-light-100" : "text-slate-500",
    text: variant === "dark" ? "text-light-100" : "text-dark-400",
  };

  const onError = (error: any) => {
    console.log(error);
    toast.error(`${type} upload failed`, {
      description: `Your ${type} could not be uploaded. Please try again.`,
    });
  };

  const onSuccess = (res: any) => {
    setFile(res);

    onFileChange(res.filePath);
    toast.success(`${type} uploaded successfully`, {
      description: `${res.filePath} uploaded successfully!`,
    });
  };

  const onValidate = (file: File) => {
    if (type === "image") {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size too large", {
          description:
            "Please upload a file that is less than 20MB in size.",
        });

        return false;
      }
    } else if (type === "video") {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size too large", {
          description:
            "Please upload a file that is less than 50MB in size.",
        });

        return false;
      }
    }

    return true;
  };

  const handleUpload = async () => {
    const input = fileInputRef.current;

    if (!input || !input.files || input.files.length === 0) {
      return;
    }

    const selectedFile = input.files[0];

    if (!onValidate(selectedFile)) {
      input.value = "";
      return;
    }

    try {
      setProgress(0);

      const authParams = await authenticator();

      const response = await upload({
        file: selectedFile,
        fileName: selectedFile.name,

        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
        publicKey: authParams.publicKey,

        useUniqueFileName: true,
        folder,

        onProgress: ({ loaded, total }) => {
          const percent = Math.round((loaded / total) * 100);

          setProgress(percent);
        },
      });

      onSuccess(response);
    } catch (error) {
      onError(error);
    } finally {
      input.value = "";
    }
  };

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleUpload}
      />

      <button
        className={cn("upload-btn", styles.button)}
        onClick={(e) => {
          e.preventDefault();

          fileInputRef.current?.click();
        }}
      >
        <NextImage
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain"
        />

        <p className={cn("text-base", styles.placeholder)}>{placeholder}</p>

        {file && (
          <p className={cn("upload-filename", styles.text)}>{file.filePath}</p>
        )}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {file &&
        (type === "image" ? (
          <Image
            alt={file.filePath ?? ""}
            src={file.filePath ?? ""}
            width={500}
            height={300}
          />
        ) : type === "video" ? (
          <Video
            src={file.filePath ?? ""}
            controls={true}
            className="h-96 w-full rounded-xl"
          />
        ) : null)}
    </ImageKitProvider>
  );
};

export default FileUpload;
