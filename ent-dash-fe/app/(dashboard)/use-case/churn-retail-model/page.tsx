"use client";

import React, { useState, useEffect } from "react";
import { ChurnAnalyticsService, useDynamicFormSchema } from "../../../../services/ChurnAnalyticsService";
import { ChurnResultCard } from "../../../../features/use-case/churn-retail-model/ChurnResultCard";
import { Activity, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ChurnRetailModelPage() {
    const { schema, isLoading: isSchemaLoading } = useDynamicFormSchema("frontend.forms.churn_retail");
    
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ prob: number; pred: string } | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Initialize form data from schema default values when schema is loaded
    useEffect(() => {
        if (schema && schema.length > 0) {
            const initialData: Record<string, any> = {};
            schema.forEach(field => {
                initialData[field.name] = field.defaultValue;
            });
            setFormData(initialData);
        }
    }, [schema]);

    const handlePredict = async () => {
        setIsLoading(true);
        try {
            const response = await ChurnAnalyticsService.predictChurn([formData]);
            
            if (response?.results) {
                // Assuming Dataiku proba array returns [prob_class_0, prob_class_1] or a dict
                const prediction = response.results.predictions[0];
                const probabilities = response.results.probabilities[0];
                
                // Get probability of class "1" (Churn)
                const prob = probabilities["1"] || Object.values(probabilities)[1] || 0;
                
                setResult({ prob, pred: prediction });
                toast.success("Prediction completed successfully");
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to predict churn risk.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        const initialData: Record<string, any> = {};
        schema.forEach(field => {
            initialData[field.name] = field.defaultValue;
        });
        setFormData(initialData);
        setResult(null);
    };

    const handleInputChange = (name: string, value: any, type: string) => {
        let parsedValue = value;
        if (type === 'number') {
            parsedValue = value === '' ? '' : Number(value);
        }
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    // Filter visible fields
    const visibleFields = schema.filter(f => f.type !== 'hidden');

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-primary-500" />
                        Churn Retail Model
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Predict customer churn probability using dynamically loaded form schemas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleReset}
                        disabled={isSchemaLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Reset
                    </button>
                    <button 
                        onClick={handlePredict}
                        disabled={isLoading || isSchemaLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />} 
                        {isLoading ? "Scoring..." : "Run Prediction"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Customer Data Profile</h3>
                    </div>
                    <div className="p-6">
                        {isSchemaLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-500">Loading dynamic schema...</span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {visibleFields.map(field => (
                                        <div key={field.name}>
                                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                {field.label || field.name}
                                            </label>
                                            <input 
                                                type={field.type === 'number' ? 'number' : 'text'} 
                                                value={formData[field.name] !== undefined ? formData[field.name] : ''} 
                                                onChange={(e) => handleInputChange(field.name, e.target.value, field.type)} 
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-2 border" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-sm border border-blue-100 dark:border-blue-900/30">
                                    <p><strong>Dynamic Form:</strong> These inputs are generated on-the-fly from the IAM SystemConfig JSON schema. Adding new features requires zero code changes to the frontend!</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {result ? (
                        <ChurnResultCard probability={result.prob} prediction={result.pred} />
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-8 text-center h-full flex flex-col items-center justify-center">
                            <Activity className="text-gray-400 mb-3" size={48} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Prediction Yet</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                Click "Run Prediction" to score this customer using the Dataiku Model.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
