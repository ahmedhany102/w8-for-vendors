
import React from 'react';
import Layout from '@/components/Layout';
import { useSupabaseContactSettings } from '@/hooks/useSupabaseContactSettings';

const Terms = () => {
  const { settings, loading } = useSupabaseContactSettings();
  const termsContent = settings?.terms_and_conditions || '';

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Terms & Conditions</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          {termsContent ? (
            <div className="prose max-w-none whitespace-pre-line">
              {termsContent}
            </div>
          ) : (
            <p className="text-gray-500 italic">No terms and conditions have been added yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
