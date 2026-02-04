import Menu from "../components/common/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const morningTiles: TileItem[] = [
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
  {
    label: "d",
    id: 4,
    image: "#",
    path: "",
  },
  {
    label: "e",
    id: 5,
    image: "#",
    path: "",
  },
];

const Morning = () => {
  return <Menu tiles={morningTiles} />;
};

export default Morning;

