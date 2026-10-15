import api from "../utils/axio";

/** Shared company library for employee report tools. */
export type CompanyBrand = {
  id: string;
  name: string;
  color: string;
  logoDataUrl: string;
};

export const listCompanyBrands = async (): Promise<CompanyBrand[]> =>
  (await api.get<{ companies: CompanyBrand[] }>("/employee/company-brands")).data.companies;

export const createCompanyBrand = async (company: Omit<CompanyBrand, "id">): Promise<CompanyBrand> =>
  (await api.post<{ company: CompanyBrand }>("/employee/company-brands", company)).data.company;

export const updateCompanyBrand = async (id: string, changes: Pick<CompanyBrand, "name" | "color">): Promise<CompanyBrand> =>
  (await api.patch<{ company: CompanyBrand }>(`/employee/company-brands/${encodeURIComponent(id)}`, changes)).data.company;

export const deleteCompanyBrand = async (id: string): Promise<void> => {
  await api.delete(`/employee/company-brands/${encodeURIComponent(id)}`);
};
