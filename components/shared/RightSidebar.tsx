import { currentUser } from "@clerk/nextjs/server";
import UserCard from "../cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUsers, fetchUser } from "@/lib/actions/user.actions";

async function RightSidebar() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  // Get IDs of people the user already follows
  const followingIds =
    userInfo?.following?.map((f: any) =>
      f._id ? f._id.toString() : f.toString(),
    ) || [];

  const suggestedPeople = await fetchUsers({
    userId: user.id,
    pageSize: 4,
    excludeIds: followingIds,
  });

  const suggestedCommunities = await fetchCommunities({ pageSize: 4 });

  return (
    <section className="custom-scrollbar rightsidebar">
      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1">
          Suggested Communities
        </h3>
        <div className="mt-7 flex w-87.5 flex-col gap-9">
          {suggestedCommunities.communities.length > 0 ? (
            suggestedCommunities.communities.map((community) => (
              <UserCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                personType="Community"
              />
            ))
          ) : (
            <p className="text-base-regular! text-light-3">
              Keep an eye out for new communities!
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-start">
        <h3 className="text-heading4-medium text-light-1">Suggested People</h3>
        <div className="mt-7 flex w-87.5 flex-col gap-10">
          {suggestedPeople.users.length > 0 ? (
            suggestedPeople.users.map((person) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            ))
          ) : (
            <p className="text-base-regular! text-light-3">
              Keep an eye out for new people!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RightSidebar;
