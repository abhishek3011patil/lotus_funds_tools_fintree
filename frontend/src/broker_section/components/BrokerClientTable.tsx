import { Button, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { BrokerClient } from "../types/broker.types";

const BrokerClientTable = ({ clients, onEdit, onDeactivate }: { clients: BrokerClient[]; onEdit: (client: BrokerClient) => void; onDeactivate: (client: BrokerClient) => void }) => (
  <TableContainer component={Paper} variant="outlined"><Table size="small" aria-label="Broker clients"><TableHead><TableRow><TableCell>Display name</TableCell><TableCell>Reference</TableCell><TableCell>Joined</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
    <TableBody>{clients.map((client) => <TableRow key={client.id}><TableCell>{client.displayName}</TableCell><TableCell>{client.reference}</TableCell><TableCell>{client.joinedAt}</TableCell><TableCell><Chip size="small" label={client.status} color={client.status === "ACTIVE" ? "success" : "default"} /></TableCell><TableCell align="right"><Button size="small" onClick={() => onEdit(client)}>Edit</Button>{client.status === "ACTIVE" && <Button size="small" color="error" onClick={() => onDeactivate(client)}>Deactivate</Button>}</TableCell></TableRow>)}</TableBody>
  </Table></TableContainer>
);

export default BrokerClientTable;
