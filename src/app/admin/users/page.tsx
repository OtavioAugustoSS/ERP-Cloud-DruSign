import UserList from '@/components/admin/UserList';
import { getUsers } from '@/actions/user';

export default async function UsersPage() {
    const { users } = await getUsers();
    return <UserList initialUsers={users || []} />;
}
