"use client";
import menu_data from "@/data/home-data/MenuData";
import Link from "next/link.js";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

import BrandLogo from "@/components/common/BrandLogo";

const NavMenu = () => {
    const pathname = usePathname();
    const [navTitle, setNavTitle] = useState("");
    const { user, role, loading } = useSupabaseUser();

    const openMobileMenu = (menu: any) => {
        if (navTitle === menu) {
            setNavTitle("");
        } else {
            setNavTitle(menu);
        }
    };

    // "Become a Seller" (src/data/home-data/MenuData.ts, class_name
    // sell-property-nav-item) is the one nav item that isn't a static
    // destination -- see BecomeSellerNav.tsx for the same logic used in
    // the header buttons. Kept in sync manually since this item is
    // rendered from the generic menu_data.map() below rather than through
    // that component directly.
    const resolveSellerNavTarget = () => {
        if (loading || role === "admin") return null;
        if (user && role === "seller") return { href: "/dashboard/add-property", label: "Add Listing" };
        if (user && role === "buyer") return { href: "/seller/register", label: "Become a Seller" };
        return { href: "/seller/login", label: "Become a Seller" };
    };

    return (
        <ul className="navbar-nav align-items-lg-center">
            <li className="d-block d-lg-none">
                <div className="logo">
                    <Link href="/" className="d-block">
                        <BrandLogo size="menu" />
                    </Link>
                </div>
            </li>
            {menu_data.map((menu: any) => {
                if (menu.class_name === "sell-property-nav-item") {
                    const target = resolveSellerNavTarget();
                    if (!target) return null;
                    return (
                        <li key={menu.id} className={`nav-item ${menu.class_name}`}>
                            <Link href={target.href} className={`nav-link ${pathname === target.href ? "active" : ""}`}>
                                {target.label}
                            </Link>
                        </li>
                    );
                }

                return (
                <li
                    key={menu.id}
                    className={`nav-item dropdown ${menu.class_name} ${menu.title === "Home" ? "no-dropdown" : ""}`}
                >
                    <Link
                        href={menu.link}
                        className={`nav-link ${menu.has_dropdown && menu.title !== "Home" ? "dropdown-toggle" : ""} 
                        ${pathname === menu.link ? "active" : ""} ${navTitle === menu.title ? "show" : ""}`}
                        onClick={() => menu.title !== "Home" && openMobileMenu(menu.title)}
                    >
                        {menu.title}
                    </Link>
                    {menu.has_dropdown && menu.title !== "Home" && (
                        <ul className={`dropdown-menu ${navTitle === menu.title ? "show" : ""}`}>
                            {menu.sub_menus &&
                                menu.sub_menus.map((sub_m: any, i: any) => (
                                    <li key={i}>
                                        <Link
                                            href={sub_m.link}
                                            className={`dropdown-item ${pathname === sub_m.link ? "active" : ""}`}
                                        >
                                            <span>{sub_m.title}</span>
                                        </Link>
                                    </li>
                                ))}
                            {menu.menu_column && (
                                <li className="row gx-1">
                                    {menu.menu_column.map((item: any) => (
                                        <div key={item.id} className="col-lg-4">
                                            <div className="menu-column">
                                                <h6 className="mega-menu-title">{item.mega_title}</h6>
                                                <ul className="style-none mega-dropdown-list">
                                                    {item.mega_menus.map((mega_m: any, i: any) => (
                                                        <li key={i}>
                                                            <Link
                                                                href={mega_m.link}
                                                                className={`dropdown-item ${pathname === mega_m.link ? "active" : ""}`}
                                                            >
                                                                <span>{mega_m.title}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </li>
                            )}
                        </ul>
                    )}
                </li>
                );
            })}
        </ul>
    );
};

export default NavMenu;
