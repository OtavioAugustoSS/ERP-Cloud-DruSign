// FlexPricingConfig is used internally by Settings UI for mutable config manipulation.
// It has all fields optional so spread-and-modify patterns work without type errors.
export type FlexPricingConfig = {
    types?: string[];
    finishings?: string[];
    pricesByType?: Record<string, number>;
    hasThickness?: boolean;
    thicknessOptions?: string[];
    pricesByThickness?: Record<string, number>;
};

export type BannerPricingConfig = {
    types: string[];
    finishings: string[];
};

export type TypedPricingConfig = {
    types: string[];
    pricesByType: Record<string, number>;
};

export type ThicknessPricingConfig = {
    hasThickness: true;
    thicknessOptions: string[];
    pricesByThickness: Record<string, number>;
};

export type PricingConfig =
    | Record<string, never>
    | BannerPricingConfig
    | TypedPricingConfig
    | ThicknessPricingConfig;
