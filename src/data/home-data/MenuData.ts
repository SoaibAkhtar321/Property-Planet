interface MenuItem {
    id: number;
    title: string;
    class_name?:string;
    link: string;
    has_dropdown: boolean;
    sub_menus?: {
        link: string;
        title: string;
    }[];
    menu_column?: {
        id: number;
        mega_title: string;
        mega_menus: {
            link: string;
            title: string;
        }[];
    }[]
}[];

const menu_data: MenuItem[] = [

    {
        id: 1,
        has_dropdown: false,
        title: "Home",
        link: "/",
    },
    
    {
        id: 2,
        has_dropdown: true,
        title: "Properties",
        link: "#",
        sub_menus: [
            
            { link: "/properties", title: "All Properties" },
            
        ],
    },


    {
        id: 3,
        has_dropdown: true,
        title: "Company",
        link: "#",
        sub_menus: [
            { link: "/about", title: "About Property Planet" },
            { link: "/contact", title: "Contact Us" },
            { link: "/faq", title: "FAQ's" },
            
        ],
    },





    {
        id: 4,
        has_dropdown: false,
        title: "Insights",
        link: "/blog",
    },

    {
        id: 5,
        has_dropdown: false,
        title: "Become a Seller",
        class_name: "sell-property-nav-item",
        link: "/seller/login",
    },
];
export default menu_data;