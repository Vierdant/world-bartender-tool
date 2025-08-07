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

export type Profile = {
  id: string;
  name: string;
  menu: MenuItem[];
  rpHelpers: RPHelper[];
  image?: string;
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
