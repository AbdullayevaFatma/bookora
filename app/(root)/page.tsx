import BookList from "@/components/BookList";
import BookOverview from "@/components/BookOverview";
import { sampleBooks } from "@/constants";
import { users } from "@/db/schema";
import { db } from "@/index";

export default async function Home() {
  const result = await db.select().from(users)
  console.log(result);
  return (
    <>
      <BookOverview {...sampleBooks[0]}/>
      <BookList title="Latest Books" books={sampleBooks} containerClassName="mt-28"/>
    </>
  );
}
