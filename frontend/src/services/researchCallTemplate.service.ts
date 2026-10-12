import axios from "axios";
import {
  isValidCallTemplate,
  type CallTemplate,
  type CallTemplateOwnerType,
  type ResearchCallMessageType,
} from "../utils/researchCallTemplate.utils";

export type ResearchCallTemplateMap = Record<
  ResearchCallMessageType,
  CallTemplate | null
>;

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

    return isValidCallTemplate(template, messageType, ownerType)
      ? template
      : null;
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
