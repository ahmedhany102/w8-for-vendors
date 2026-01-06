
-- 1. Insert one row per unique (product_id, color)
INSERT INTO public.product_color_variants (product_id, color, image)
SELECT
  product_id,
  color,
  MAX(image_url) AS image
FROM
  public.product_variants
GROUP BY
  product_id, color;

-- 2. Insert each (product_id, color, size) as an option (links to the correct color_variant)
INSERT INTO public.product_color_variant_options (color_variant_id, size, price, stock)
SELECT
  pcv.id,
  pv.size,
  pv.price,
  pv.stock
FROM
  public.product_variants pv
JOIN
  public.product_color_variants pcv
    ON pv.product_id = pcv.product_id
    AND pv.color = pcv.color;

-- Your per-color/size variant data is now safely copied over!
-- Do not drop the old product_variants table until the new code is live and verified.
