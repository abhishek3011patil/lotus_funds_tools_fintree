import Menu from "../components/page_Mainapp/Menu";

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

const specialTiles: TileItem[] = [
  {
    label: "ExceltoJSON",
    id: 1,
    path: "/automation/ExcelTool",
  }
];

const Special = () => {
  return <Menu tiles={specialTiles} />;
};

export default Special;
