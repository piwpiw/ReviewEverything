CREATE TYPE "TaxonomyKind" AS ENUM (
  'CUISINE',
  'REGION',
  'DISH_TYPE',
  'COURSE',
  'PROTEIN',
  'MAIN_INGREDIENT',
  'COOKING_TECHNIQUE',
  'FLAVOR',
  'TEXTURE',
  'TEMPERATURE',
  'SERVICE_STYLE',
  'DIETARY',
  'ALLERGEN',
  'OCCASION',
  'BEVERAGE_PAIRING',
  'PRICE_TIER'
);

CREATE TYPE "CorrelationType" AS ENUM (
  'PAIRS_WITH',
  'SIMILAR_TO',
  'CONTRASTS_WITH',
  'SUBSTITUTES_FOR',
  'DERIVED_FROM',
  'INFLUENCES',
  'SIGNATURE_FOR',
  'POPULAR_WITH',
  'TREND_ALIGNS_WITH'
);

CREATE TYPE "CorrelationSourceType" AS ENUM (
  'CURATED',
  'IMPORTED',
  'INFERRED',
  'ANALYTICS'
);

CREATE TABLE "Restaurant" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "brand_name" TEXT,
  "description" TEXT,
  "country" TEXT,
  "region_depth1" TEXT,
  "region_depth2" TEXT,
  "city" TEXT,
  "district" TEXT,
  "address" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "price_band" TEXT,
  "service_model" TEXT,
  "phone" TEXT,
  "website_url" TEXT,
  "source_ref" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");
CREATE INDEX "Restaurant_region_depth1_region_depth2_city_idx" ON "Restaurant"("region_depth1", "region_depth2", "city");
CREATE INDEX "Restaurant_price_band_service_model_idx" ON "Restaurant"("price_band", "service_model");

CREATE TABLE "Chef" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "bio" TEXT,
  "signature_style" TEXT,
  "career_years" INTEGER,
  "nationality" TEXT,
  "hometown" TEXT,
  "source_ref" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chef_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Chef_slug_key" ON "Chef"("slug");
CREATE INDEX "Chef_name_idx" ON "Chef"("name");
CREATE INDEX "Chef_signature_style_idx" ON "Chef"("signature_style");

CREATE TABLE "Dish" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "canonical_name" TEXT,
  "description" TEXT,
  "origin_region" TEXT,
  "spice_level" INTEGER,
  "complexity_level" INTEGER,
  "serving_temperature" TEXT,
  "source_ref" TEXT,
  "image_url" TEXT,
  "metadata" JSONB,
  "primary_chef_id" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Dish_slug_key" ON "Dish"("slug");
CREATE INDEX "Dish_canonical_name_idx" ON "Dish"("canonical_name");
CREATE INDEX "Dish_origin_region_serving_temperature_idx" ON "Dish"("origin_region", "serving_temperature");

CREATE TABLE "Ingredient" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "canonical_name" TEXT,
  "ingredient_group" TEXT,
  "description" TEXT,
  "seasonality" TEXT,
  "source_ref" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");
CREATE INDEX "Ingredient_ingredient_group_idx" ON "Ingredient"("ingredient_group");
CREATE INDEX "Ingredient_canonical_name_idx" ON "Ingredient"("canonical_name");

CREATE TABLE "TaxonomyTerm" (
  "id" SERIAL NOT NULL,
  "kind" "TaxonomyKind" NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon_emoji" TEXT,
  "icon_key" TEXT,
  "badge_color" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "parent_id" INTEGER,
  "depth" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "aliases" JSONB,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaxonomyTerm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_taxonomy_kind_slug" ON "TaxonomyTerm"("kind", "slug");
CREATE INDEX "TaxonomyTerm_kind_parent_id_idx" ON "TaxonomyTerm"("kind", "parent_id");

CREATE TABLE "RestaurantDish" (
  "id" SERIAL NOT NULL,
  "restaurant_id" INTEGER NOT NULL,
  "dish_id" INTEGER NOT NULL,
  "menu_label" TEXT,
  "course_label" TEXT,
  "price" INTEGER,
  "is_signature" BOOLEAN NOT NULL DEFAULT false,
  "is_seasonal" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "availability_note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RestaurantDish_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_restaurant_dish" ON "RestaurantDish"("restaurant_id", "dish_id");
CREATE INDEX "RestaurantDish_restaurant_id_is_signature_idx" ON "RestaurantDish"("restaurant_id", "is_signature");
CREATE INDEX "RestaurantDish_dish_id_is_active_idx" ON "RestaurantDish"("dish_id", "is_active");

CREATE TABLE "ChefRestaurant" (
  "id" SERIAL NOT NULL,
  "chef_id" INTEGER NOT NULL,
  "restaurant_id" INTEGER NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'EXECUTIVE_CHEF',
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "start_date" DATE,
  "end_date" DATE,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChefRestaurant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_chef_restaurant_role" ON "ChefRestaurant"("chef_id", "restaurant_id", "role");
CREATE INDEX "ChefRestaurant_restaurant_id_is_current_idx" ON "ChefRestaurant"("restaurant_id", "is_current");
CREATE INDEX "ChefRestaurant_chef_id_is_current_idx" ON "ChefRestaurant"("chef_id", "is_current");

CREATE TABLE "DishIngredient" (
  "id" SERIAL NOT NULL,
  "dish_id" INTEGER NOT NULL,
  "ingredient_id" INTEGER NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'PRIMARY',
  "amount_text" TEXT,
  "unit" TEXT,
  "is_core" BOOLEAN NOT NULL DEFAULT true,
  "preparation_note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DishIngredient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_dish_ingredient_role" ON "DishIngredient"("dish_id", "ingredient_id", "role");
CREATE INDEX "DishIngredient_ingredient_id_is_core_idx" ON "DishIngredient"("ingredient_id", "is_core");

CREATE TABLE "DishTaxonomyAssignment" (
  "id" SERIAL NOT NULL,
  "dish_id" INTEGER NOT NULL,
  "taxonomy_term_id" INTEGER NOT NULL,
  "relevance_score" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DishTaxonomyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_dish_taxonomy" ON "DishTaxonomyAssignment"("dish_id", "taxonomy_term_id");
CREATE INDEX "DishTaxonomyAssignment_taxonomy_term_id_is_primary_idx" ON "DishTaxonomyAssignment"("taxonomy_term_id", "is_primary");

CREATE TABLE "ChefTaxonomyAssignment" (
  "id" SERIAL NOT NULL,
  "chef_id" INTEGER NOT NULL,
  "taxonomy_term_id" INTEGER NOT NULL,
  "relevance_score" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChefTaxonomyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_chef_taxonomy" ON "ChefTaxonomyAssignment"("chef_id", "taxonomy_term_id");
CREATE INDEX "ChefTaxonomyAssignment_taxonomy_term_id_is_primary_idx" ON "ChefTaxonomyAssignment"("taxonomy_term_id", "is_primary");

CREATE TABLE "RestaurantTaxonomyAssignment" (
  "id" SERIAL NOT NULL,
  "restaurant_id" INTEGER NOT NULL,
  "taxonomy_term_id" INTEGER NOT NULL,
  "relevance_score" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RestaurantTaxonomyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_restaurant_taxonomy" ON "RestaurantTaxonomyAssignment"("restaurant_id", "taxonomy_term_id");
CREATE INDEX "RestaurantTaxonomyAssignment_taxonomy_term_id_is_primary_idx" ON "RestaurantTaxonomyAssignment"("taxonomy_term_id", "is_primary");

CREATE TABLE "IngredientTaxonomyAssignment" (
  "id" SERIAL NOT NULL,
  "ingredient_id" INTEGER NOT NULL,
  "taxonomy_term_id" INTEGER NOT NULL,
  "relevance_score" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IngredientTaxonomyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_ingredient_taxonomy" ON "IngredientTaxonomyAssignment"("ingredient_id", "taxonomy_term_id");
CREATE INDEX "IngredientTaxonomyAssignment_taxonomy_term_id_is_primary_idx" ON "IngredientTaxonomyAssignment"("taxonomy_term_id", "is_primary");

CREATE TABLE "DishCorrelation" (
  "id" SERIAL NOT NULL,
  "source_dish_id" INTEGER NOT NULL,
  "target_dish_id" INTEGER NOT NULL,
  "correlation_type" "CorrelationType" NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0.50,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "rationale" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DishCorrelation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_dish_correlation" ON "DishCorrelation"("source_dish_id", "target_dish_id", "correlation_type");
CREATE INDEX "DishCorrelation_target_dish_id_correlation_type_idx" ON "DishCorrelation"("target_dish_id", "correlation_type");

CREATE TABLE "TaxonomyRelation" (
  "id" SERIAL NOT NULL,
  "source_term_id" INTEGER NOT NULL,
  "target_term_id" INTEGER NOT NULL,
  "correlation_type" "CorrelationType" NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0.50,
  "source_type" "CorrelationSourceType" NOT NULL DEFAULT 'CURATED',
  "rationale" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaxonomyRelation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_taxonomy_relation" ON "TaxonomyRelation"("source_term_id", "target_term_id", "correlation_type");
CREATE INDEX "TaxonomyRelation_target_term_id_correlation_type_idx" ON "TaxonomyRelation"("target_term_id", "correlation_type");

CREATE TABLE "DishAnalyticsSnapshot" (
  "id" BIGSERIAL NOT NULL,
  "dish_id" INTEGER NOT NULL,
  "metric_date" DATE NOT NULL,
  "mention_count" INTEGER NOT NULL DEFAULT 0,
  "restaurant_count" INTEGER NOT NULL DEFAULT 0,
  "menu_count" INTEGER NOT NULL DEFAULT 0,
  "avg_price" INTEGER,
  "popularity_score" DECIMAL(10,2),
  "satisfaction_score" DECIMAL(10,2),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DishAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_dish_metric_date" ON "DishAnalyticsSnapshot"("dish_id", "metric_date");
CREATE INDEX "DishAnalyticsSnapshot_metric_date_idx" ON "DishAnalyticsSnapshot"("metric_date");

CREATE TABLE "TaxonomyAnalyticsSnapshot" (
  "id" BIGSERIAL NOT NULL,
  "taxonomy_term_id" INTEGER NOT NULL,
  "metric_date" DATE NOT NULL,
  "dish_count" INTEGER NOT NULL DEFAULT 0,
  "restaurant_count" INTEGER NOT NULL DEFAULT 0,
  "chef_count" INTEGER NOT NULL DEFAULT 0,
  "popularity_score" DECIMAL(10,2),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaxonomyAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uniq_taxonomy_metric_date" ON "TaxonomyAnalyticsSnapshot"("taxonomy_term_id", "metric_date");
CREATE INDEX "TaxonomyAnalyticsSnapshot_metric_date_idx" ON "TaxonomyAnalyticsSnapshot"("metric_date");

ALTER TABLE "Campaign" ADD COLUMN "restaurant_id" INTEGER;
ALTER TABLE "Campaign" ADD COLUMN "representative_dish_id" INTEGER;
CREATE INDEX "Campaign_restaurant_id_representative_dish_id_idx" ON "Campaign"("restaurant_id", "representative_dish_id");

ALTER TABLE "Dish"
  ADD CONSTRAINT "Dish_primary_chef_id_fkey"
  FOREIGN KEY ("primary_chef_id") REFERENCES "Chef"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaxonomyTerm"
  ADD CONSTRAINT "TaxonomyTerm_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RestaurantDish"
  ADD CONSTRAINT "RestaurantDish_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantDish"
  ADD CONSTRAINT "RestaurantDish_dish_id_fkey"
  FOREIGN KEY ("dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChefRestaurant"
  ADD CONSTRAINT "ChefRestaurant_chef_id_fkey"
  FOREIGN KEY ("chef_id") REFERENCES "Chef"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChefRestaurant"
  ADD CONSTRAINT "ChefRestaurant_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DishIngredient"
  ADD CONSTRAINT "DishIngredient_dish_id_fkey"
  FOREIGN KEY ("dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DishIngredient"
  ADD CONSTRAINT "DishIngredient_ingredient_id_fkey"
  FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DishTaxonomyAssignment"
  ADD CONSTRAINT "DishTaxonomyAssignment_dish_id_fkey"
  FOREIGN KEY ("dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DishTaxonomyAssignment"
  ADD CONSTRAINT "DishTaxonomyAssignment_taxonomy_term_id_fkey"
  FOREIGN KEY ("taxonomy_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChefTaxonomyAssignment"
  ADD CONSTRAINT "ChefTaxonomyAssignment_chef_id_fkey"
  FOREIGN KEY ("chef_id") REFERENCES "Chef"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChefTaxonomyAssignment"
  ADD CONSTRAINT "ChefTaxonomyAssignment_taxonomy_term_id_fkey"
  FOREIGN KEY ("taxonomy_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestaurantTaxonomyAssignment"
  ADD CONSTRAINT "RestaurantTaxonomyAssignment_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantTaxonomyAssignment"
  ADD CONSTRAINT "RestaurantTaxonomyAssignment_taxonomy_term_id_fkey"
  FOREIGN KEY ("taxonomy_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IngredientTaxonomyAssignment"
  ADD CONSTRAINT "IngredientTaxonomyAssignment_ingredient_id_fkey"
  FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngredientTaxonomyAssignment"
  ADD CONSTRAINT "IngredientTaxonomyAssignment_taxonomy_term_id_fkey"
  FOREIGN KEY ("taxonomy_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DishCorrelation"
  ADD CONSTRAINT "DishCorrelation_source_dish_id_fkey"
  FOREIGN KEY ("source_dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DishCorrelation"
  ADD CONSTRAINT "DishCorrelation_target_dish_id_fkey"
  FOREIGN KEY ("target_dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaxonomyRelation"
  ADD CONSTRAINT "TaxonomyRelation_source_term_id_fkey"
  FOREIGN KEY ("source_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxonomyRelation"
  ADD CONSTRAINT "TaxonomyRelation_target_term_id_fkey"
  FOREIGN KEY ("target_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DishAnalyticsSnapshot"
  ADD CONSTRAINT "DishAnalyticsSnapshot_dish_id_fkey"
  FOREIGN KEY ("dish_id") REFERENCES "Dish"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaxonomyAnalyticsSnapshot"
  ADD CONSTRAINT "TaxonomyAnalyticsSnapshot_taxonomy_term_id_fkey"
  FOREIGN KEY ("taxonomy_term_id") REFERENCES "TaxonomyTerm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_representative_dish_id_fkey"
  FOREIGN KEY ("representative_dish_id") REFERENCES "Dish"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
