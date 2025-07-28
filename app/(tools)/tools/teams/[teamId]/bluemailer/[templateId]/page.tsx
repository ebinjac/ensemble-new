import { notFound } from 'next/navigation';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getTemplate, updateTemplate } from '@/app/actions/bluemailer/templates';
import { getTeamApplications } from '@/app/actions/applications';
import EmailEditor from '@/components/emailEditor/index';

interface EditTemplatePageProps {
  params: {
    teamId: string;
    templateId: string;
  };
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { teamId, templateId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch template and applications
  const [template, applications] = await Promise.all([
    getTemplate(teamId, templateId),
    getTeamApplications(teamId),
  ]);

  if (!template) {
    notFound();
  }

  const handleSave = async (templateData: any) => {
    'use server';
    
    const result = await updateTemplate(teamId, templateId, {
      name: templateData.name,
      canvasSettings: templateData.canvasSettings,
      components: templateData.components,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to save template');
    }
  };

  const handleExport = async (html: string) => {
    'use server';
    
    // Here you could save the HTML to a file service or return it
    console.log('Exported HTML:', html);
  };

  return (
    <div className="h-screen">
      <EmailEditor
        initialTemplate={{
          id: template.id,
          name: template.name,
          components: template.components as any, // Type assertion to bypass type error
          canvasSettings: template.canvasSettings,
        }}
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
}
