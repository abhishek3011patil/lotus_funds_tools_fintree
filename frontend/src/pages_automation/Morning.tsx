import Menu from "../components/page_Mainapp/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const morningTiles: TileItem[] = [
  {
    label: "Emailer",
    id: 1,
    image: "#",
    path: "",
  },
  {
    label: "FII/DII maker",
    id: 2,
    image: "#",
    path: "/automation/Morning/fiidll",
  },
  {
    label: "Daily market dashboard",
    id: 3,
    image: "#",
    path: "/automation/Morning/market-dashboard",
  },

];

const Morning = () => {
  return <Menu tiles={morningTiles} />;
};

export default Morning;

