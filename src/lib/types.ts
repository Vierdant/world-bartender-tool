export type MenuItem = {
  id: string;
  name: string;
  type: string;
  available: boolean;
  price: number;
  image?: string;
  emotes: MultistepEmotes;
};

export type MultistepEmotes = {
  advanced: boolean;
  sections: {
    name: string;
    steps: string[];
  }[];
};

export type RPHelper = {
  id: string;
  name: string;
  commands: string[]; // e.g. ["passes the {items} to {customerName}"]
};

export type ThemeColors = {
  bodyColor: string;
  fieldColor: string;
  borderColor: string;
  textColor: string;
  textColorMuted: string;
  textColorAccent: string;
  secondaryColor: string;
  secondaryColorHover: string;
  accentColor: string;
  accentColorHover: string;
  accentColorDark: string;
  errorColor: string;
  errorColorDark: string;
  infoColor: string;
  infoColorDark: string;
  acceptColor: string;
  acceptColorDark: string;
};

export type CustomTheme = {
  light: ThemeColors;
  dark: ThemeColors;
};

export type Profile = {
  id: string;
  name: string;
  menu: MenuItem[];
  rpHelpers: RPHelper[];
  image?: string;
  customTheme?: CustomTheme;
};

export type Order = {
  id: string;
  customerName?: string;
  customerId?: number;
  items: {
    id: string; qty: number;
    _emoteSectionIndex?: number;
    _emoteStepIndex?: number;
  }[]; // item + quantity
  createdAt?: number;
};
