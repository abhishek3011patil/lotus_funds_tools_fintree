import Menu from "../components/page_Mainapp/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const weeklyTiles: TileItem[] = [
  {
    label: "a",
    id: 1,
    image: "#",
    path: "",
  },
];

const Weekly = () => {
  return <Menu tiles={weeklyTiles} />;
};

export default Weekly;
