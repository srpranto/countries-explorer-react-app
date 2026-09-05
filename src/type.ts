type ApiField<T> = T | { [key: string]: T };

export interface CountryType {
  name: {
    common: string;
    official: string;
  };
  ccn3: ApiField<string>;
  flags: ApiField<{ png: string; svg: string }>;
  population?: ApiField<number>;
  capital?: ApiField<string[]>;
  region?: ApiField<string>;
  subregion?: ApiField<string>;
  area?: ApiField<number>;
  borders?: ApiField<string[]>;
  timezones?: ApiField<string[]>;
  languages?: ApiField<Record<string, string>>;
  currencies?: ApiField<Record<string, { name: string; symbol?: string }>>;
}
