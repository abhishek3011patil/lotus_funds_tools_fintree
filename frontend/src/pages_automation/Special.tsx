import Menu from "../components/page_Mainapp/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const specialTiles: TileItem[] = [
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
  {
    label: "f",
    id: 6,
    image: "#",
    path: "",
  },
  {
    label: "g",
    id: 7,
    image: "#",
    path: "",
  },
  {
    label: "h",
    id: 8,
    image: "#",
    path: "",
  },
];

const Special = () => {
  return <Menu tiles={specialTiles} />;
};

export default Special;
