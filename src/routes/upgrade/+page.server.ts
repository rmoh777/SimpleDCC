import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const email = url.searchParams.get('email');

  return {
    email: email || null,
  };
}; 