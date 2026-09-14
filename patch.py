with open('api/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

insert_str = '''
@app.get("/retention-tasks", response_model=list[schemas.RetentionTaskOut])
def get_retention_tasks(
    status: str | None = None,
    priority: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RetentionTask)
    if status:
        query = query.filter(models.RetentionTask.status == status)
    if priority:
        query = query.filter(models.RetentionTask.priority == priority)
        
    tasks = query.order_by(models.RetentionTask.created_at.desc()).all()
    for t in tasks:
        t.customer_name = t.customer.name if t.customer and t.customer.name else f"Customer #{t.customer_id}"
    return tasks

@app.get("/retention-tasks/{task_id}", response_model=schemas.RetentionTaskOut)
def get_retention_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.RetentionTask).filter(models.RetentionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.customer_name = task.customer.name if task.customer and task.customer.name else f"Customer #{task.customer_id}"
    return task

@app.patch("/retention-tasks/{task_id}", response_model=schemas.RetentionTaskOut)
def update_retention_task(task_id: int, update_data: schemas.RetentionTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.RetentionTask).filter(models.RetentionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if update_data.status is not None:
        task.status = update_data.status
        if update_data.status == "completed":
            from datetime import datetime, timezone
            task.completed_at = datetime.now(timezone.utc)
            
    if update_data.priority is not None:
        task.priority = update_data.priority
        
    db.commit()
    db.refresh(task)
    task.customer_name = task.customer.name if task.customer and task.customer.name else f"Customer #{task.customer_id}"
    return task
'''

content = content.replace('@app.get("/reports/summary")', insert_str + '\n\n@app.get("/reports/summary")')

with open('api/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
