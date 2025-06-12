# Django Backend API Structure for Flow Editor

## Overview
This document outlines the Django backend structure needed to support the flow editor functionality.

## Django Models

### models.py
```python
from django.db import models
from django.contrib.auth.models import User
import json

class FlowDiagram(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    nodes = models.JSONField(default=list)  # Store React Flow nodes
    edges = models.JSONField(default=list)  # Store React Flow edges
    metadata = models.JSONField(default=dict)  # Additional flow metadata
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.CharField(max_length=20, default='1.0.0')
    tags = models.JSONField(default=list)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

class FlowExecution(models.Model):
    flow = models.ForeignKey(FlowDiagram, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('stopped', 'Stopped')
    ], default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)

class NodeExecution(models.Model):
    flow_execution = models.ForeignKey(FlowExecution, on_delete=models.CASCADE)
    node_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='pending')
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict)
    executed_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)
```

## Django Views (API Endpoints)

### views.py
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import FlowDiagram, FlowExecution
from .serializers import FlowDiagramSerializer, FlowExecutionSerializer

class FlowDiagramViewSet(viewsets.ModelViewSet):
    serializer_class = FlowDiagramSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FlowDiagram.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a flow diagram"""
        flow = self.get_object()
        execution = FlowExecution.objects.create(
            flow=flow,
            status='pending'
        )
        
        # TODO: Implement flow execution logic
        # This would involve processing nodes based on their connections
        # and executing the appropriate logic for each node type
        
        return Response({
            'execution_id': execution.id,
            'status': 'started',
            'message': 'Flow execution started'
        })

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a flow diagram"""
        original_flow = self.get_object()
        new_flow = FlowDiagram.objects.create(
            name=f"{original_flow.name} (Copy)",
            description=original_flow.description,
            owner=request.user,
            nodes=original_flow.nodes,
            edges=original_flow.edges,
            metadata=original_flow.metadata,
            tags=original_flow.tags
        )
        serializer = self.get_serializer(new_flow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get predefined flow templates"""
        templates = [
            {
                'name': 'IoT Data Pipeline',
                'description': 'Basic IoT sensor data processing pipeline',
                'nodes': [
                    # Predefined nodes for common IoT scenarios
                ],
                'edges': [],
                'tags': ['iot', 'template']
            },
            {
                'name': 'Data Analytics Flow',
                'description': 'Process and analyze sensor data',
                'nodes': [],
                'edges': [],
                'tags': ['analytics', 'template']
            }
        ]
        return Response(templates)
```

## Serializers

### serializers.py
```python
from rest_framework import serializers
from .models import FlowDiagram, FlowExecution, NodeExecution

class FlowDiagramSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlowDiagram
        fields = ['id', 'name', 'description', 'nodes', 'edges', 'metadata', 
                 'is_active', 'created_at', 'updated_at', 'version', 'tags']
        read_only_fields = ['created_at', 'updated_at']

class FlowExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlowExecution
        fields = ['id', 'flow', 'status', 'started_at', 'completed_at', 
                 'result', 'error_message']
        read_only_fields = ['started_at', 'completed_at']

class NodeExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NodeExecution
        fields = ['id', 'flow_execution', 'node_id', 'status', 'input_data', 
                 'output_data', 'executed_at', 'duration_ms']
```

## URLs

### urls.py
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlowDiagramViewSet

router = DefaultRouter()
router.register(r'flows', FlowDiagramViewSet, basename='flows')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

## Frontend Integration

### API Service (React)
```javascript
// src/services/flowAPI.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const flowAPI = {
  // Get all flows for current user
  getFlows: () => axios.get(`${API_BASE_URL}/flows/`),
  
  // Get specific flow
  getFlow: (id) => axios.get(`${API_BASE_URL}/flows/${id}/`),
  
  // Create new flow
  createFlow: (flowData) => axios.post(`${API_BASE_URL}/flows/`, flowData),
  
  // Update flow
  updateFlow: (id, flowData) => axios.put(`${API_BASE_URL}/flows/${id}/`, flowData),
  
  // Delete flow
  deleteFlow: (id) => axios.delete(`${API_BASE_URL}/flows/${id}/`),
  
  // Execute flow
  executeFlow: (id) => axios.post(`${API_BASE_URL}/flows/${id}/execute/`),
  
  // Duplicate flow
  duplicateFlow: (id) => axios.post(`${API_BASE_URL}/flows/${id}/duplicate/`),
  
  // Get templates
  getTemplates: () => axios.get(`${API_BASE_URL}/flows/templates/`)
};
```

## Node Execution Engine

The backend should include a flow execution engine that can:

1. **Parse Flow Structure**: Convert React Flow nodes and edges into an execution graph
2. **Execute Nodes**: Run each node type's specific logic:
   - **Input nodes**: Generate or receive data
   - **Function nodes**: Process data (moving average, min/max, custom Python)
   - **Network nodes**: Handle MQTT, HTTP, WebSocket connections
   - **Storage nodes**: Execute database queries
   - **Output nodes**: Send results to displays or external systems
3. **Handle Dependencies**: Ensure nodes execute in correct order based on connections
4. **Error Handling**: Gracefully handle node failures and provide debugging info
5. **Real-time Updates**: Provide websocket updates on execution progress

## Installation Instructions

1. Install Django and dependencies:
```bash
pip install django djangorestframework django-cors-headers psycopg2-binary
```

2. Add to Django settings:
```python
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework',
    'corsheaders',
    'flow_editor',  # Your app name
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... existing middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
]
```

3. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

This structure provides a complete backend foundation for your Node-RED style flow editor!