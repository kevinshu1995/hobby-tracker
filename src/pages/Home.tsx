export async function clientLoader() {
  // you can now fetch data here
  return {
    title: "Home page",
  };
}

export default function Component() {
  return <h1>Home</h1>;
}
