// Stand-in for the full per-country address table: these forms have no address field, so the
// site ships only the US and default layouts (saves ~45 KB). Swap back to
// ../wix/address-templates.generated if an address question is ever added to a form.
import type { AddressSubdivisions, AddressTemplatePart } from "../wix/address-templates.generated";
export type { AddressSubdivisions, AddressTemplatePart };
export const ADDRESS_TEMPLATES: {
  defaultTemplate: string;
  byCountry: Record<string, string>;
  templates: Record<string, AddressTemplatePart[]>;
  countryNames: Record<string, string>;
  subdivisions: Record<string, AddressSubdivisions>;
} = {
  defaultTemplate: "COMMON",
  byCountry: { US: "US" },
  templates: {
    "COMMON":[{"sub":"addressLine","required":true,"hidden":false},{"sub":"addressLine2","required":false,"hidden":true},{"sub":"city","required":true,"hidden":false},{"sub":"postalCode","required":true,"hidden":false}],
    "US":[{"sub":"addressLine","required":true,"hidden":false},{"sub":"addressLine2","required":false,"hidden":true},{"sub":"city","required":true,"hidden":false},{"sub":"subdivision","required":true,"hidden":false},{"sub":"postalCode","required":true,"hidden":false}],
  },
  countryNames: { US: "United States" },
  subdivisions: {},
};
