---
title: "Devops概念梳理"
date: 2024-12-30T13:50:01+08:00
draft: false
categories: '技术'
---

## 前言

Devops 从18年左右发展至今已经非常的成熟。可以作为一个独立职业，因为里面有很多细节。作为互联网软件开发者，我从开发的视角梳理下一些应知应会的框架，主要达到一个能使用，能了解架构，出了问题大概知道在哪个环节。具体细节暂时不追求。

  
## 从 Docker 开始

Docker，是一种容器化的概念，属于虚拟化技术的一种形式。以颗粒度更小的方式，隔离性也更好的方式完成宿主机的资源榨取。他与虚拟机的核心区别是 

Docker与虚拟机的核心区别主要在于以下几个方面：

1. **架构层级**：
   - **虚拟机（Virtual Machine, VM）**：虚拟机在宿主操作系统之上运行一个完整的客户操作系统。它使用Hypervisor（如VMware、KVM、Hyper-V等）来虚拟化硬件资源，每个虚拟机都有自己的内核、操作系统和应用程序。
   - **Docker容器**：Docker容器在宿主操作系统之上运行，但它们与宿主共享相同的操作系统内核。容器是通过容器引擎（如Docker）来管理和隔离的。每个容器包含应用程序及其所有依赖项，但不包含完整的操作系统。

2. **资源利用效率**：
   - **虚拟机**：由于每个虚拟机都需要一个完整的操作系统，因此启动和运行时会消耗更多的内存和CPU资源。
   - **Docker容器**：由于所有容器共享宿主操作系统的内核，启动时间更快，资源开销也更小。这使得容器更加轻量级，可以在同样的硬件上运行更多实例。

3. **启动时间**：
   - **虚拟机**：由于需要启动一个完整的操作系统，虚拟机通常需要数分钟时间才能完全启动并准备好使用。
   - **Docker容器**：因为没有完整的OS启动过程，Docker容器通常可以在几秒钟内完成启动。

4. **隔离性与安全性**：
   - **虚拟机**：提供了强隔离，因为每个VM运行在完全独立的环境中，包括独立的内核。因此，安全性较高。
   - **Docker容器**：虽然提供了进程级别的隔离，但仍共享宿主OS内核，因此理论上存在一些安全风险。不过，通过适当配置和使用工具（如SELinux、AppArmor等），可以增强安全性。

5. **存储与持久化数据管理方式**：
   - **虚拟机**：通常使用虚拟磁盘文件来存储数据，这些文件可以独立于其他VM进行管理。
   - **Docker容器**：使用卷（volumes）和绑定挂载（bind mounts）来持久化数据，这些可以被多个容器共享或独立管理。

总而言之，Docker作为一种轻量级、便捷、高效且快速部署的方法，在云原生应用开发中得到了广泛应用。而虚拟机则仍然适用于需要强隔离、安全要求高以及需要运行不同类型操作系统等场景。

Docker的核心原理是: 

>Docker的核心原理是利用操作系统级的虚拟化技术（即容器化技术）来创建、部署和运行应用程序。具体来说，Docker 的核心原理包括以下几个方面：

1. **Namespace（命名空间）隔离**：
   - Docker 使用 Linux 内核的命名空间（Namespace）功能来实现进程隔离。这些命名空间包括 UTS（主机和域名）、IPC（进程间通信）、PID（进程 ID）、Network（网络）、Mount（文件系统挂载点）等。
   - 每个容器都有独立的命名空间，因此它们之间不会互相干扰，提供了类似虚拟机的隔离效果。

2. **Cgroups（控制组）资源控制**：
   - Cgroups 是 Linux 内核提供的一种机制，用于限制、记录和隔离单个进程组的资源使用情况。Docker 使用 Cgroups 来限制容器可以使用的 CPU、内存、磁盘 I/O 等资源。
   - 通过这种方式，Docker 能够确保每个容器在资源分配上互不干扰，并且可以避免某个容器滥用系统资源。

3. **Union File System（联合文件系统）**：
   - Docker 使用联合文件系统，如 AUFS、OverlayFS 等，来实现镜像和容器的分层存储。每个 Docker 镜像由多层组成，每一层都是只读的，当需要对镜像进行修改时，会在顶层添加一个可写层。
   - 这种分层设计不仅提高了存储效率，还使得镜像可以快速构建和共享。

4. **Container Image（容器镜像）**：
   - 容器镜像是一个包含应用程序及其所有依赖项的只读模板。Docker 容器是从这些镜像创建出来的一种运行实例。
   - 镜像可以通过 Dockerfile 定义，并且支持版本管理，这使得应用程序环境变得可移植且易于复制。

5. **Container Runtime**：
   - Docker 提供了一个高效的运行时环境，使得容器能够快速启动和停止。
   - 容器运行时负责管理容器生命周期，包括创建、启动、停止和销毁等操作。

6. **Networking and Storage**：
   - Docker 提供了一整套网络解决方案，使得不同主机上的容器能够通过虚拟网络进行通信。
   - 同时，Docker 也支持将本地存储或分布式存储挂载到容器中，以便持久化数据。

通过这些核心技术，Docker 实现了轻量级、高效、安全的应用程序虚拟化，为开发者提供了一种简便的方法在任何环境中一致地部署应用。

Docker 里重要的概念是 Image 就是镜像，可以理解为你一个系统镜像。是说明一个容器里怎么执行的。Image 的概念


是类似于一个模板，它包含了运行应用所需的所有依赖和配置。每个镜像由一系列层次组成，每一层都描述了文件系统的一部分变化。了解镜像的构建和使用，有助于我们更好地管理容器化环境。

### 镜像的构建

镜像通常通过 Dockerfile 来定义和构建。Dockerfile 是一个文本文件，其中包含了一系列指令，这些指令定义了如何从基础镜像创建一个新的自定义镜像。例如，常见的 Dockerfile 指令包括：

1. **FROM**：
   - 指定基础镜像。例如，`FROM ubuntu:latest` 表示以最新版本的 Ubuntu 镜像为基础。

2. **RUN**：
   - 执行命令。例如，`RUN apt-get update && apt-get install -y nginx` 表示在创建镜像时执行更新包索引并安装 Nginx。

3. **COPY** 和 **ADD**：
   - 将本地文件或目录复制到镜像中。例如，`COPY . /app` 表示将当前目录下的所有内容复制到镜像中的 `/app` 目录。

4. **CMD** 和 **ENTRYPOINT**：
   - 定义容器启动时要执行的命令。例如，`CMD [ "nginx", "-g", "daemon off;" ]` 表示容器启动时运行 Nginx。

### 镜像仓库

构建好的镜像可以推送到远程仓库（如 Docker Hub 或私有仓库），以便在不同环境中拉取和使用。常用操作包括：

- `docker push`: 将本地镜像推送到远程仓库。
- `docker pull`: 从远程仓库拉取指定镜像。
- `docker tag`: 给本地镜像打标签，以便标识不同版本。

### 容器生命周期管理

容器是基于镜像实例化出来的运行实体。为了高效管理容器生命周期，我们需要掌握以下基本操作：

1. **启动容器**： 
   - 使用 `docker run` 命令启动新容器，例如 `docker run -d --name my-nginx nginx:latest` 启动一个名为 my-nginx 的 Nginx 容器。

2. **停止容器**：
   - 使用 `docker stop` 命令停止正在运行的容器，例如 `docker stop my-nginx` 停止名为 my-nginx 的容器。

3. **删除容器**：
   - 使用 `docker rm` 命令删除已停止的容器，例如 `docker rm my-nginx` 删除名为 my-nginx 的容器。

4. **查看日志**：
   - 使用 `docker logs` 命令查看指定容器的日志输出，例如 `docker logs my-nginx`.

5. **进入正在运行的容器**：
   - 使用 `docker exec` 命令进入正在运行中的某个容器进行调试或维护，例如 `docker exec -it my-nginx /bin/bash`.

通过对这些操作的熟练掌握，我们可以高效地管理和维护基于 Docker 的应用环境，从而提升开发与运维效率。

## K8s 编排 & 集群

Kubernetes（简称k8s）是一个开源的容器编排平台，用于自动化容器化应用的部署、扩展和管理。它提供了一个统一的平台，使得开发、测试和生产环境中的应用管理变得更加简便和高效。

### 核心概念

1. **节点（Node）**：
   - 节点是 Kubernetes 集群中的工作机器，可以是物理机或虚拟机。每个节点上都运行着多个容器，同时也有必要的组件来管理这些容器，包括 kubelet、kube-proxy 等。

2. **Pod**：
   - Pod 是 Kubernetes 中最小的部署单位，一个 Pod 可以包含一个或多个紧密耦合的容器，这些容器共享网络命名空间和存储卷。Pod 通常用于运行单个应用实例或多个协同工作的应用组件。

3. **控制平面（Control Plane）**：
   - 控制平面负责集群的全局决策（如调度）以及检测和响应集群事件（如启动新的 pod）。主要组件包括 kube-apiserver、etcd、kube-scheduler 和 kube-controller-manager 等。

4. **命名空间（Namespace）**：
   - 命名空间用于在同一物理集群内创建多个虚拟集群，提供资源隔离机制。不同团队或项目可以使用独立的命名空间来管理各自的资源，避免互相干扰。

5. **服务（Service）**：
   - 服务是一种抽象，定义了一组逻辑上的 Pod 以及访问这些 Pod 的策略。服务通过标签选择器将请求负载分发给后台的一组 Pod，即使这些 Pod 在不同节点上运行。

6. **控制器（Controller）**：
   - 控制器负责维护系统的期望状态，如 Deployment、ReplicaSet 和 StatefulSet 等。它们通过监控当前状态并将其调整为期望状态来确保系统的一致性和可靠性。

### 部署与管理

Kubernetes 提供了多种资源对象，用于描述和管理集群中的应用：

1. **Deployment**:
   - Deployment 定义了应用程序的描述，包括镜像版本、副本数量等，并负责创建或更新 ReplicaSet 来维持指定数量的 Pod 副本。
   
2. **ReplicaSet**:
   - ReplicaSet 确保任何时候都有指定数量的 Pod 副本在运行，如果某个 Pod 挂掉，会立即启动新的副本来替代它。
   
3. **StatefulSet**:
   - StatefulSet 专门用于有状态应用程序，它能保证每个 Pod 有固定标识，并支持有序部署与扩展。
   
4. **DaemonSet**:
   - DaemonSet 确保所有符合条件的节点上都运行一个特定类型的 Pod，例如日志收集代理或监控代理。
   
5. **Job 和 CronJob**:
   - Job 用于一次性任务，而 CronJob 则用于周期性任务，两者都确保任务在一定条件下成功执行。

通过理解并灵活运用这些核心概念和资源对象，我们能够实现复杂容器化应用在 Kubernetes 集群上的自动化运维，从而提高系统可靠性与可伸缩性。

一般 devops 平台上会让用户添加服务，发布服务，服务的 ingress 转发规则配置， 服务的环境变量配置等，展开来讲如下： 

### 添加服务

在 DevOps 平台上，添加服务通常是指将一个新的应用程序或微服务引入到 Kubernetes 集群中。这个过程通常包括以下步骤：

1. **定义服务描述文件**：
   - 使用 YAML 或 JSON 格式编写 Kubernetes 服务和部署配置文件。例如，定义一个包含 Deployment 和 Service 的 YAML 文件。

2. **创建命名空间**：
   - 如果需要隔离资源，可以先创建一个新的命名空间。例如，`kubectl create namespace my-app`。

3. **应用配置文件**：
   - 使用 `kubectl apply -f` 命令将配置文件应用到集群中。例如，`kubectl apply -f my-app-deployment.yaml`。

### 发布服务

发布服务是指将应用程序的更新版本部署到生产环境中。这通常涉及以下步骤：

1. **构建新镜像**：
   - 在 CI/CD 管道中构建并推送新的 Docker 镜像。例如，使用 `docker build` 和 `docker push` 命令。

2. **更新 Deployment 配置**：
   - 修改 Deployment 配置文件中的镜像版本，并重新应用配置。例如，更新 `image: my-app:v2.0` 并运行 `kubectl apply -f my-app-deployment.yaml`。

3. **逐步替换 Pod**：
   - Kubernetes 会根据 Deployment 配置滚动更新 Pod，以最小化停机时间。可以通过 `kubectl rollout status deployment/my-app` 查看更新状态。

### Ingress 转发规则配置

Ingress 是一种 API 对象，可以管理外部访问 Kubernetes 服务的方式。通过 Ingress 控制器和规则配置，可以灵活地处理路由和负载均衡：

1. **创建 Ingress 资源**：
   - 定义 Ingress 资源的 YAML 文件，包括主机名、路径、目标服务等。例如：
     ```yaml
     apiVersion: networking.k8s.io/v1
     kind: Ingress
     metadata:
       name: my-app-ingress
       namespace: my-app
     spec:
       rules:
       - host: myapp.example.com
         http:
           paths:
           - path: /
             pathType: Prefix
             backend:
               service:
                 name: my-app-service
                 port:
                   number: 80
     ```

2. **应用 Ingress 配置**：
   - 使用 `kubectl apply -f ingress.yaml` 将 Ingress 资源应用到集群中。

3. **验证访问**：
   - 确认域名解析和路由是否正确，通过浏览器或命令行工具（如 `curl`）访问相应 URL 进行测试。

### 环境变量配置

在 Kubernetes 中，可以通过 ConfigMap 和 Secret 来管理环境变量：

1. **创建 ConfigMap 或 Secret**：
   - 定义包含环境变量的 ConfigMap 或 Secret。例如，使用以下命令创建 ConfigMap：
     ```shell
     kubectl create configmap app-config --from-literal=KEY=value --namespace=my-app
     ```

2. **在 Pod 中引用环境变量**：
   - 在 Deployment 配置文件中引用 ConfigMap 或 Secret 环境变量，例如：
     ```yaml
     apiVersion: apps/v1
     kind: Deployment
     metadata:
       name: my-app-deployment
       namespace: my-app
     spec:
       template:
         spec:
           containers:
           - name: my-container
             image: my-image:v1.0
             envFrom:
             - configMapRef:
                 name: app-config
             env:
             - name: SECRET_KEY # 引用 Secret 环境变量示例 
               valueFrom:
                 secretKeyRef:
                   name: app-secret 
                   key: SECRET_KEY 
    ```

通过这些步骤，我们可以灵活地管理和发布容器化应用，从而实现高效的 DevOps 流程。

下面讲一讲 k8s 集群 

的搭建与管理。

### Kubernetes 集群的搭建

Kubernetes 集群是由一组工作节点（Node）和控制平面（Control Plane）组件组成。搭建 Kubernetes 集群有多种方法，以下是几种常用的方法：

1. **使用 Minikube**：
   - Minikube 是一个单节点的 Kubernetes 集群，非常适合本地开发和测试。通过以下命令可以快速启动一个 Minikube 集群：
     ```shell
     minikube start
     ```

2. **使用 kubeadm**：
   - kubeadm 是官方提供的工具，用于快速部署生产级别的 Kubernetes 集群。下面是基本步骤：
     1. 在所有节点上安装 Docker 和 kubeadm。
     2. 在主节点上初始化集群：
        ```shell
        sudo kubeadm init --pod-network-cidr=10.244.0.0/16
        ```
     3. 配置 kubectl 命令行工具：
        ```shell
        mkdir -p $HOME/.kube
        sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
        sudo chown $(id -u):$(id -g) $HOME/.kube/config
        ```
     4. 在工作节点上加入集群（获取 join 命令并在工作节点上运行）。

3. **使用云服务提供商的托管方案**：
   - 各大云服务提供商（如 AWS、GCP、Azure 等）都提供了托管的 Kubernetes 服务，例如 AWS 的 EKS、GCP 的 GKE 和 Azure 的 AKS。这些服务简化了集群管理，用户只需关注应用部署。

### 管理 Kubernetes 集群

一旦集群搭建完成，我们需要通过各种工具和策略来管理和维护它：

1. **监控与日志**：
   - 使用 Prometheus 和 Grafana 监控集群状态和应用性能。
   - 使用 Fluentd 或 ELK 堆栈收集和分析日志。

2. **自动伸缩**：
   - 配置 Horizontal Pod Autoscaler (HPA) 根据负载自动调整 Pod 数量。
   - 使用 Cluster Autoscaler 根据资源需求自动调整节点数量。

3. **备份与恢复**：
   - 定期备份 etcd 数据存储，以防止数据丢失。
   - 使用 Velero 等工具进行应用级别备份和恢复。

4. **安全性**：
   - 配置 RBAC（角色权限控制）确保访问控制。
   - 使用网络策略（Network Policies）隔离不同命名空间的流量。
   - 定期扫描镜像漏洞，确保镜像安全。

通过这些步骤，我们可以确保 Kubernetes 集群稳定、高效、安全地运行，从而为容器化应用提供强大的支撑平台。
