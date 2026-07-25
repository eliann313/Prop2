import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // `remotePatterns` y no el viejo `domains` (deprecado en Next 16): permite acotar también
    // el pathname, así el optimizador de imágenes solo procesa lo que sale de NUESTRA cuenta
    // de Cloudinary y no cualquier archivo alojado en res.cloudinary.com.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
};

export default nextConfig;
