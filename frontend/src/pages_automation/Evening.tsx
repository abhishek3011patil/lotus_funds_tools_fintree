import Menu from "../components/page_Mainapp/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const eveningTiles: TileItem[] = [
  {
    label: "a",
    id: 1,
    image: "#",
    path: "",
  },
  {
    label: "b",
    id: 2,
    image: "#",
    path: "",
  },
  {
    label: "c",
    id: 3,
    image: "#",
    path: "",
  },
];

const Evening = () => {
  return <Menu tiles={eveningTiles} />;
};
export default Evening;

