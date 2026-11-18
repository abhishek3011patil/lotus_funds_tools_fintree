import axios from "axios";
import {
  isValidCallTemplate,
  type CallTemplate,
  type CallTemplateOwnerType,
  type ResearchCallMessageType,
} from "../utils/researchCallTemplate.utils";
import api from "../utils/axio";

export type ResearchCallTemplateMap = Record<
  ResearchCallMessageType,
  CallTemplate | null
>;

export type NamedResearchCallTemplate = { id: string; name: string; messageType: ResearchCallMessageType; template: CallTemplate; groupIds: string[]; createdAt: string; updatedAt: string };

interface StoredTemplateResponse {
  template?: unknown;
}

interface TemplateListResponse {
  data?: Partial<
    Record<
      ResearchCallMessageType,
      StoredTemplateResponse | null
    >
  >;
}

interface TemplateSaveResponse {
  data?: {
    template?: unknown;
  };
}

const apiBaseUrl = import.meta.env.VITE_API_URL;

export const fetchNamedResearchCallTemplates = async (token: string): Promise<NamedResearchCallTemplate[]> => {
  const response = await api.get<{ data?: NamedResearchCallTemplate[] }>("/research/named-message-templates", { headers: { Authorization: `Bearer ${token}` } });
  return response.data.data ?? [];
};

export const saveNamedResearchCallTemplate = async (token: string, input: { templateId?: string; messageType: ResearchCallMessageType; name: string; template: CallTemplate; groupIds: string[] }) => {
  try {
    const response = await axios.post<{ data: NamedResearchCallTemplate }>(`${apiBaseUrl}/api/research/named-message-templates`, input, { headers: { Authorization: `Bearer ${token}` } });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
      throw new Error(serverMessage || error.message);
    }
    throw error;
  }
};

export const deleteNamedResearchCallTemplate = async (token: string, templateId: string) =>
  axios.delete(`${apiBaseUrl}/api/research/named-message-templates/${encodeURIComponent(templateId)}`, { headers: { Authorization: `Bearer ${token}` } });

export const fetchResearchCallTemplates = async (
  token: string,
  ownerType: CallTemplateOwnerType = "RA"
): Promise<ResearchCallTemplateMap> => {
  const response = await axios.get<TemplateListResponse>(
    `${apiBaseUrl}/api/${ownerType === "BROKER" ? "broker" : "research"}/message-templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const readTemplate = (
    messageType: ResearchCallMessageType
  ): CallTemplate | null => {
    const template =
      response.data.data?.[messageType]?.template;

    if (!isValidCallTemplate(template, messageType, ownerType)) return null;
    const normalized = JSON.parse(JSON.stringify(template)) as CallTemplate;
    normalized.blocks.forEach(block => {
      if (block.type === "field" && (block.fieldKey === "disclaimer" || block.fieldKey === "brokerDisclaimer")) block.locked = false;
    });
    return normalized;
  };

  return {
    NEW_CALL: readTemplate("NEW_CALL"),
    ERRATA: readTemplate("ERRATA"),
  };
};

export const saveResearchCallTemplate = async (
  token: string,
  messageType: ResearchCallMessageType,
  template: CallTemplate,
  ownerType: CallTemplateOwnerType = "RA"
): Promise<CallTemplate> => {
  if (!isValidCallTemplate(template, messageType, ownerType)) {
    throw new Error(
      "The template is invalid or is missing required fields."
    );
  }

  const response = await axios.put<TemplateSaveResponse>(
    `${apiBaseUrl}/api/${ownerType === "BROKER" ? "broker" : "research"}/message-templates/${messageType}`,
    { template },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const savedTemplate = response.data.data?.template;
  if (!isValidCallTemplate(savedTemplate, messageType, ownerType)) {
    throw new Error(
      "The server returned an invalid template."
    );
  }

  return savedTemplate;
};
