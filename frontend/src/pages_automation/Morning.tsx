import Menu from "../components/common/Menu";

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
    label: "FII/DLL",
    id: 2,
    image: "#",
    path: "",
  },
  {
    label: "One pager",
    id: 3,
    image: "#",
    path: "",
  },

];

const Morning = () => {
  return <Menu tiles={morningTiles} />;
};

export default Morning;

