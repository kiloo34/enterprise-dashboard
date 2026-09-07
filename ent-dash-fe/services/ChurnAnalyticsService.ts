import { api } from '../utils/api';
import useSWR from 'swr';

export interface ScoringResult {
    predictions: string[];
    probabilities: Record<string, number>[];
}

export interface ScoringResponse {
    status: string;
    message: string;
    results: ScoringResult;
}

export interface FormFieldSchema {
    name: string;
    label?: string;
    type: string;
    defaultValue?: string | number;
}

const fetcher = (url: string) => api<any>(url);

export const useDynamicFormSchema = (schemaKey: string) => {
    const { data, error, isLoading, mutate } = useSWR<FormFieldSchema[]>('/api/system-config/public/' + schemaKey, fetcher);
    // Parse the JSON string from the value if necessary
    let parsedData: FormFieldSchema[] = [];
    if (data && (data as any).value) {
        try {
            parsedData = JSON.parse((data as any).value);
        } catch (e) {
            console.error("Failed to parse schema JSON", e);
        }
    }
    return { schema: parsedData, isLoading, isError: error, mutate };
};

export class ChurnAnalyticsService {
    static async predictChurn(data: Record<string, any>[]): Promise<ScoringResponse> {
        try {
            const response = await api<ScoringResponse>('/api/analytics/v1/scoring/churn-retail/predict', {
                method: 'POST',
                data: { data }
            });
            return response;
        } catch (error) {
            console.error("Error predicting churn:", error);
            throw error;
        }
    }
}
