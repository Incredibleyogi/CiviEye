import PostCard from "../components/posts/PostCard";

export default function Home() {
  return (
    <div className="flex flex-col">
      <PostCard />
      <PostCard />
    </div>
  );
}
