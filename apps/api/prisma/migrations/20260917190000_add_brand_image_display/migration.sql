CREATE TYPE "BrandImageDisplay" AS ENUM ('LOGO', 'PROFILE');

ALTER TABLE "flows"
ADD COLUMN "brand_image_display" "BrandImageDisplay" NOT NULL DEFAULT 'LOGO';
