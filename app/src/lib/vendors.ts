/**
 * ELI5: The list of sample service providers (inspectors, plumbers…) the app shows.
 * What: Vendor type and the demo VENDORS list, kept out of the page so the client view can use it without loading the whole Vendors page.
 * Owns: Vendor data only.
 * Depends on: lucide icons, BadgeColor.
 */
import type { LucideIcon } from "lucide-react";
import { Hammer, Leaf, ShieldCheck, Snowflake, Wrench } from "lucide-react";
import type { BadgeColor } from "@/lib/types";

export interface Vendor {
  name: string;
  category: string;
  initials: string;
  description: string;
  color: BadgeColor;
  icon: LucideIcon;
}

export const VENDORS: Vendor[] = [
  {
    name: "Desert Home Inspections",
    category: "Home inspections",
    initials: "DH",
    description:
      "A thorough look at your future home, with a clear report and friendly guidance.",
    color: "clay",
    icon: ShieldCheck,
  },
  {
    name: "Organ Mountain Inspections",
    category: "Home inspections",
    initials: "OM",
    description:
      "From roof to foundation, helping you understand the home you’re choosing.",
    color: "sage",
    icon: ShieldCheck,
  },
  {
    name: "Mesilla Valley Plumbing",
    category: "Plumbing",
    initials: "MV",
    description:
      "Thoughtful help with leaks, fixtures, water heaters and everyday repairs.",
    color: "blue",
    icon: Wrench,
  },
  {
    name: "Sun Valley Heating & Air",
    category: "Heating & cooling",
    initials: "SV",
    description:
      "Keeping your home comfortable through every New Mexico season.",
    color: "gold",
    icon: Snowflake,
  },
  {
    name: "Southwest Garden Co.",
    category: "Landscaping",
    initials: "SG",
    description:
      "Water-wise planting, seasonal care and a little more life in your outdoor space.",
    color: "sage",
    icon: Leaf,
  },
  {
    name: "Good Neighbor Home Services",
    category: "Home maintenance",
    initials: "GN",
    description:
      "A helping hand for the small projects that make a house feel like home.",
    color: "clay",
    icon: Hammer,
  },
];
