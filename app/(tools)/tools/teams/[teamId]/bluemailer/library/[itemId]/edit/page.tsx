import { notFound } from 'next/navigation';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { getLibraryItemWithComponents } from '@/app/actions/bluemailer/team-library';
import { EditLibraryItemForm } from '@/components/bluemailer/edit-library-item-form';

interface EditLibraryItemPageProps {
  params: {
    teamId: string;
    itemId: string;
  };
}

export default async function EditLibraryItemPage({ params }: EditLibraryItemPageProps) {
  const { teamId, itemId } = params;

  // Verify team access
  await requireTeamAccess(teamId);

  // Fetch the library item with components
  const libraryItem = await getLibraryItemWithComponents(itemId, teamId);

  if (!libraryItem) {
    notFound();
  }

  // Check if user has permission to edit (only team items can be edited)
  if (libraryItem.teamId !== teamId) {
    notFound(); // User doesn't have permission to edit this item
  }

  return (
    <div className=" mx-auto py-6">
      <EditLibraryItemForm
        libraryItem={libraryItem}
        teamId={teamId}
      />
    </div>
  );
}

export async function generateMetadata({ params }: EditLibraryItemPageProps) {
  const { teamId, itemId } = params;
  
  try {
    const libraryItem = await getLibraryItemWithComponents(itemId, teamId);
    
    return {
      title: `Edit ${libraryItem?.name || 'Library Item'} - Bluemailer`,
      description: `Edit library ${libraryItem?.isComponent ? 'component' : 'template'}`,
    };
  } catch {
    return {
      title: 'Edit Library Item - Bluemailer',
    };
  }
}
