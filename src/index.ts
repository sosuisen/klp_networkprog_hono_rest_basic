import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

type Todo = {
	id: number;
	title: string;
	completed: boolean;
};

type PostTodo = {
	title: string;
};

type PutTodo = {
	title: string;
	completed: boolean;
};

const todos: Todo[] = [
	{ id: 1, title: "ネーム", completed: true },
	{ id: 2, title: "下書き", completed: false },
];

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Middlewareがコンテキストにプロパティをセットする場合、
// 型安全に処理するためVariablesを指定する
const validationMiddleware = createMiddleware<{
	Variables: {
		id: number;
	};
}>(async (c, next) => {
	const id = Number(c.req.param("id"));
	if (Number.isNaN(id)) {
		return c.text("Invalid ID format. Please provide a valid number.", 400);
	}
	if (!todos.some((todo) => todo.id === id)) {
		return c.text("Todo not found", 404);
	}
	c.set("id", id);
	await next();
});

app.get("/todos", (c) => c.json(todos));

// path params
// c.get('id')はc.var.idでもよい。
app.get("/todos/:id", validationMiddleware, (c) => {
	const todo = todos.find((todo) => todo.id === c.get("id"));
	return c.json(todo);
});

app.post("/todos", async (c) => {
	// バリデーションは課題とする。
	const body = await c.req.json<PostTodo>();
	let lastId = 0;
	if (todos.length > 0) lastId = todos[todos.length - 1].id;

	const newTodo = { ...body, id: lastId + 1, completed: false };
	todos.push(newTodo);
	return c.json(newTodo, 201);
});

app.put("/todos/:id", validationMiddleware, async (c) => {
	const body = await c.req.json<PutTodo>();
	const index = todos.findIndex((todo) => todo.id === c.get("id"));
	const newTodo = { ...body, id: todos[index].id };
	todos[index] = newTodo;
	return c.json(todos[index]);
});

app.delete("/todos/:id", validationMiddleware, (c) => {
	const index = todos.findIndex((todo) => todo.id === c.get("id"));
	todos.splice(index, 1);
	return c.json({ id: c.get("id") });
});

export default app;
